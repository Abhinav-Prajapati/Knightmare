import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Logger } from '@nestjs/common';
import { validate } from 'class-validator';
import { ChessMoveDto } from './dto/sendMove.dto';
import { ChessEngineRequestDto } from './dto/engine.dto';

/**
 * Socket event types for chess engine communication
 */
enum SocketEvents {
    JOIN_GAME = 'join_game',
    SEND_MOVE = 'send_move',
    GAME_STATE = 'game_state',
    ERROR = 'error',
    MESSAGE = 'message'
}

/**
 * Engine player ID used for moves made by the computer
 */
const ENGINE_PLAYER_ID = '8e7c6367-8ba1-410d-81ba-c315dd02b1aa';

/**
 * Gateway for handling WebSocket communication for single-player chess against a chess engine
 * 
 * Handles game initialization, player moves, engine responses, and connection management
 */
@WebSocketGateway({ cors: true, namespace: '/engine' })
export class ChessEngineGateway {
    @WebSocketServer() server: Server;

    /**
     * Maps game IDs to client socket IDs for session tracking
     */
    private playerSessions: Map<string, string> = new Map();
    private readonly logger = new Logger('ChessGateway');

    constructor(private readonly gameService: GameService) {
        this.logger.log('Single Player Chess Socket.io initialized');
    }

    /**
     * Handles a player joining a game against the chess engine
     * 
     * @param client The client socket connection
     * @param data Game initialization data including game ID, player color choice, and difficulty setting
     */
    @SubscribeMessage(SocketEvents.JOIN_GAME)
    async handleJoinGame(client: Socket, data: { gameId: string; playAs: 'w' | 'b', difficulty: number }) {
        console.log('attempt to join room')
        try {
            // Associate the client with this game
            this.associateClientWithGame(client, data.gameId);

            // If player chooses black, make engine (white) move first
            if (data.playAs === 'b') {
                await this.makeEngineMove(data.gameId, data.difficulty);
            }

            // Send current game state to client(s)
            const gameState = await this.gameService.getGameState(data.gameId);
            this.emitGameState(data.gameId, gameState);
        } catch (error) {
            this.handleError(client, error, 'Failed to join game');
        }
    }

    /**
     * Handles player move submission and triggers engine response
     * 
     * @param client The client socket connection
     * @param chessMove The move data submitted by the player
     */
    @SubscribeMessage(SocketEvents.SEND_MOVE)
    async handleSendMove(client: Socket, chessMove: ChessMoveDto) {
        try {
            // Validate move data
            await this.validateMoveData(chessMove);

            this.logger.log(
                `player_move_received: ${chessMove.playerId} in ${chessMove.gameId}, ${chessMove.UCImove}`
            );

            // Process player's move
            const updatedGameState = await this.makePlayerMove(chessMove);

            // If game isn't over, get engine's response move
            if (!updatedGameState.gameOverStatus.isGameOver) {
                await this.makeEngineMove(chessMove.gameId, chessMove.difficulty);
            }
        } catch (error) {
            this.handleMoveError(client, chessMove, error);
        }
    }

    /**
     * Handles new client connection
     * 
     * @param client The client socket connection
     */
    handleConnection(client: Socket) {
        this.logger.log({
            event: 'client_connected',
            clientId: client.id,
            timestamp: new Date().toISOString(),
            totalConnections: this.server?.engine?.clientsCount || 'unknown'
        });

        client.emit(SocketEvents.MESSAGE, {
            user: 'System',
            message: 'Welcome to single player stockfish chess!'
        });
    }

    /**
     * Handles client disconnection
     * 
     * @param client The client socket connection
     */
    handleDisconnect(client: Socket) {
        const gamesToRemove = this.findGamesForClient(client.id);

        gamesToRemove.forEach(gameId => {
            this.playerSessions.delete(gameId);
            this.logger.debug({
                event: 'player_disconnected',
                clientId: client.id,
                gameId: gameId,
                timestamp: new Date().toISOString()
            });
        });
    }

    /**
     * Associates a client socket with a game ID
     * 
     * @param client The client socket
     * @param gameId The game identifier
     */
    private associateClientWithGame(client: Socket, gameId: string): void {
        this.playerSessions.set(gameId, client.id);
        client.join(gameId);
        this.logger.debug(`player_joined: ${client.id} to game ${gameId}`);
    }

    /**
     * Makes a move with the chess engine and updates game state
     * 
     * @param gameId The game identifier
     * @param difficulty The engine difficulty level
     */
    private async makeEngineMove(gameId: string, difficulty: number): Promise<void> {
        this.logger.debug(`requesting_engine_move: ${gameId}`);

        // Get current game state
        const gameState = await this.gameService.getGameState(gameId);

        // Prepare engine move request
        const engineRequest = new ChessEngineRequestDto();
        engineRequest.fen = gameState.fen;
        engineRequest.difficulty = difficulty;

        // Get move from engine
        const engineMove = await this.gameService.getEngineMove(engineRequest);
        this.logger.debug(`engine_move_received: ${gameId}, ${engineMove.moveUci}`);

        // Create move DTO for engine's move
        const engineChessMove = new ChessMoveDto();
        engineChessMove.gameId = gameId;
        engineChessMove.UCImove = engineMove.moveUci;
        engineChessMove.SANmove = engineMove.moveSan;
        engineChessMove.playerId = ENGINE_PLAYER_ID;
        engineChessMove.difficulty = difficulty;

        // Apply engine's move
        const updatedGameState = await this.gameService.makeMove(engineChessMove);
        this.logger.debug(`engine_move_applied: ${gameId}, new fen=${updatedGameState.fen}`);

        // Broadcast updated state
        this.emitGameState(gameId, updatedGameState);
    }

    /**
     * Processes a player's move and updates game state
     * 
     * @param moveDto The player's move data
     * @returns Updated game state after the move
     */
    private async makePlayerMove(moveDto: ChessMoveDto): Promise<any> {
        const updatedGameState = await this.gameService.makeMove(moveDto);
        this.logger.debug(`player_move_processed: ${moveDto.gameId}, new fen=${updatedGameState.fen}`);

        // Broadcast updated state after player's move
        this.emitGameState(moveDto.gameId, updatedGameState);
        return updatedGameState;
    }

    /**
     * Validates move data using class-validator
     * 
     * @param moveData The move data to validate
     * @throws Error if validation fails
     */
    private async validateMoveData(moveData: ChessMoveDto): Promise<void> {
        const chessMoveDto = Object.assign(new ChessMoveDto(), moveData);
        const errors = await validate(chessMoveDto);

        if (errors.length > 0) {
            throw new Error(errors.map(err =>
                Object.values(err.constraints).join(', ')).join('; ')
            );
        }
    }

    /**
     * Emits game state to clients in a game room
     * 
     * @param gameId The game identifier
     * @param gameState The game state to emit
     */
    private emitGameState(gameId: string, gameState: any): void {
        this.server.to(gameId).emit(SocketEvents.GAME_STATE, gameState);
    }

    /**
     * Handles and logs errors
     * 
     * @param client The client socket
     * @param error The error that occurred
     * @param message Optional message to send to the client
     */
    private handleError(client: Socket, error: Error, message: string = 'An error occurred'): void {
        this.logger.error(`Error: ${error.message}`);
        client.emit(SocketEvents.ERROR, { message });
    }

    /**
     * Handles move-specific errors
     * 
     * @param client The client socket
     * @param moveData The move data that caused the error
     * @param error The error that occurred
     */
    private handleMoveError(client: Socket, moveData: ChessMoveDto, error: Error): void {
        const errorMsg = `Move error (${moveData.gameId}): ${error.message}`;

        this.logger.error(
            `move_error: ${moveData.playerId} in ${moveData.gameId}, ${moveData.UCImove}, err=${error.message}`
        );

        client.emit(SocketEvents.ERROR, {
            message: errorMsg,
            code: error['code'] || 'MOVE_ERROR',
        });
    }

    /**
     * Finds all game IDs associated with a client
     * 
     * @param clientId The client socket ID
     * @returns Array of game IDs associated with the client
     */
    private findGamesForClient(clientId: string): string[] {
        const gamesToRemove: string[] = [];

        this.playerSessions.forEach((storedClientId, gameId) => {
            if (storedClientId === clientId) {
                gamesToRemove.push(gameId);
            }
        });

        return gamesToRemove;
    }
}