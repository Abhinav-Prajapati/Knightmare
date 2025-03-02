import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Logger } from '@nestjs/common';
import { validate } from 'class-validator';
import { ChessMoveDto } from './dto/send-move.dto';
import { ChessEngineRequestDto } from './dto/engine.dto';

const socketEvents = {
    JOIN_GAME: 'join_game',
    SEND_MOVE: 'send_move',
};

@WebSocketGateway({ cors: true, namespace: '/engine' })
export class ChessEngineGateway {
    @WebSocketServer() server: Server;
    private playerSessions: Map<string, string> = new Map(); // Maps gameId to clientId
    private readonly logger = new Logger('ChessGateway');

    constructor(private readonly gameService: GameService) {
        this.logger.log('Single Player Chess Socket.io initialized');
    }

    @SubscribeMessage(socketEvents.JOIN_GAME)
    async handleJoinGame(client: Socket, gameId: string) {
        try {
            // Associate the client with this game
            this.playerSessions.set(gameId, client.id);
            client.join(gameId);
            this.logger.debug(`player_joined: ${client.id} to game ${gameId}`);

            // Get and broadcast initial game state
            const gameState = await this.gameService.getGameState(gameId);
            this.server.to(gameId).emit('game_state', { gameState });
        } catch (error) {
            this.logger.error(`join_game_error: ${gameId}, ${error.message}`);
            client.emit('error', { message: 'Failed to join game' });
        }
    }

    @SubscribeMessage(socketEvents.SEND_MOVE)
    async handleSendMove(client: Socket, chessMove: ChessMoveDto) {
        try {
            // Validate DTO
            const chessMoveDto = Object.assign(new ChessMoveDto(), chessMove);
            const errors = await validate(chessMoveDto);
            if (errors.length > 0) {
                throw new Error(errors.map(err => Object.values(err.constraints).join(', ')).join('; '));
            }

            this.logger.log(
                `player_move_received: ${chessMoveDto.playerId} in ${chessMoveDto.gameId}, ${chessMoveDto.moveFrom}->${chessMoveDto.moveTo}${chessMoveDto.promotion ? `,p=${chessMoveDto.promotion}` : ''}`
            );
            // hot fix 
            chessMoveDto.promotion = null

            // Process the player's move
            const updatedGameState = await this.gameService.makeMove(chessMoveDto);
            this.logger.debug(`player_move_processed: ${chessMoveDto.gameId}, new fen=${updatedGameState.fen}`);

            // Broadcast updated game state after player's move
            this.server.to(chessMoveDto.gameId).emit('game_state', updatedGameState);

            // If the game isn't over, get the chess engine's move
            if (!updatedGameState.gameOverStatus.isGameOver) {
                this.logger.debug(`requesting_engine_move: ${chessMoveDto.gameId}`);

                // Get chess engine's response move using the game service
                const chessEngineRequest = new ChessEngineRequestDto()
                chessEngineRequest.fen = updatedGameState.fen
                chessEngineRequest.difficulty = 10
                chessEngineRequest.timeLimit = 0.5

                const engineMoveResult = await this.gameService.getEngineMove(chessEngineRequest);
                this.logger.debug(`engine_move_received: ${chessMoveDto.gameId}, ${engineMoveResult.move}`);

                const engineChessMove = new ChessMoveDto()
                engineChessMove.gameId = chessMoveDto.gameId
                engineChessMove.moveFrom = engineMoveResult.move.slice(0, 2)
                engineChessMove.moveTo = engineMoveResult.move.slice(2, 4)
                engineChessMove.playerId = '8e7c6367-8ba1-410d-81ba-c315dd02b1aa'

                // Update game state with engine's move
                const updatedGameState2 = await this.gameService.makeMove(engineChessMove);
                this.logger.debug(`engine_move_applied: ${chessMoveDto.gameId}, new fen=${updatedGameState2.fen}`);
                // Broadcast final game state after engine's move
                this.server.to(chessMoveDto.gameId).emit('game_state', updatedGameState2);
            }
        } catch (error) {
            const errorMsg = `Move error (${chessMove.gameId}): ${error.message}`;
            this.logger.error(
                `move_error: ${chessMove.playerId} in ${chessMove.gameId}, ${chessMove.moveFrom}->${chessMove.moveTo}, err=${error.message}`
            );
            client.emit('error', {
                message: errorMsg,
                code: error.code || 'MOVE_ERROR',
            });
        }
    }

    handleConnection(client: Socket) {
        this.logger.log({
            event: 'client_connected',
            clientId: client.id,
            timestamp: new Date().toISOString(),
            totalConnections: this.server?.engine?.clientsCount || 'unknown'
        });
        client.emit('message', { user: 'System', message: 'Welcome to single player chess!' });
    }

    handleDisconnect(client: Socket) {
        // Find and remove any games associated with this client
        const gamesToRemove: string[] = [];
        this.playerSessions.forEach((clientId, gameId) => {
            if (clientId === client.id) {
                gamesToRemove.push(gameId);
            }
        });

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
}