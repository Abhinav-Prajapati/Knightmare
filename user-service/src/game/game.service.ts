import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Chess } from 'chess.js';
import { RedisService } from '../redis.service';
import { PrismaService } from '../prisma.service';
import { GameStatus, GameOutcome, WinMethod } from '@prisma/client';
import { GameOverStatusDto, GameStateDto } from './dto/game.dto';
import { PlayerColor } from './enums/game.enums';
import { plainToInstance } from 'class-transformer';
import { ChessMoveDto } from './dto/sendMove.dto';
import { HttpService } from '@nestjs/axios';
import {
  ChessEngineRequestDto,
  ChessEngineResponseDto,
} from './dto/engine.dto';
import { GameState } from './types/chessService';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GameService {
  private readonly logger = new Logger('game service');
  private readonly baseUrl = 'http://localhost:8000';

  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  private generateGameId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let randomStr = '';
    for (let i = 0; i < 5; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `g_${randomStr}`;
  }

  private async saveGameToRedis(
    gameId: string,
    creatorUserId: string,
    playerColor: PlayerColor,
  ) {
    try {
      await this.httpService
        .post('http://localhost:8000/engine/save-game-in-redis', {
          gameId,
          playerId: creatorUserId,
          playAs: playerColor === PlayerColor.WHITE ? 'w' : 'b',
          engineId: 'engine-id-placeholder', // Adjust based on your logic
        })
        .toPromise();

      this.logger.log(
        `Game ${gameId} successfully saved to Redis via Python API`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to save game ${gameId} to Redis: ${error.message}`,
      );
    }
  }

  async createGame(creatorUserId: string, playerColor: PlayerColor) {
    const gameId = this.generateGameId();
    const chess = new Chess(); // For testing only

    // Determine player positions
    const whitePlayerId =
      playerColor === PlayerColor.WHITE ? creatorUserId : null;
    const blackPlayerId =
      playerColor === PlayerColor.BLACK ? creatorUserId : null;

    // Store game in PostgreSQL
    await this.prisma.game.create({
      data: {
        id: gameId,
        whitePlayerId,
        blackPlayerId,
        status: GameStatus.WAITING,
        initialFen: chess.fen(),
      },
    });

    // Call Python API to save game in Redis
    await this.saveGameToRedis(gameId, creatorUserId, playerColor);

    this.logger.log(`Game created and saved to PostgreSQL. Game ID: ${gameId}`);
    return gameId;
  }

  async getGameState(gameId: string) {
    const gameDataString = await this.redisService.get(gameId);
    if (!gameDataString) {
      throw new HttpException('Game not found in redis', HttpStatus.NOT_FOUND);
    }
    const gameStateDto: GameStateDto = plainToInstance(
      GameStateDto,
      JSON.parse(gameDataString),
    );
    return gameStateDto;
  }
  /**
   * Make a player move in the chess game
   * @param chessMoveDto Move details
   * @returns Updated game state
   */
  async makePlayerMove(chessMoveDto: ChessMoveDto): Promise<GameState> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<GameState>(
          `${this.baseUrl}/engine/move/player`,
          chessMoveDto,
        ),
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'Player move failed');
    }
  }

  /**
   * Request computer move for the game
   * @param gameId Game identifier
   * @returns Updated game state after computer move
   */
  async makeComputerMove(gameId: string): Promise<GameState> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<GameState>(
          `${this.baseUrl}/engine/move/computer`,
          { gameId },
        ),
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'Computer move failed');
    }
  }

  async makeMove(chessMoveDto: ChessMoveDto) {
    const logger = new Logger('Make Move');
    logger.log(
      `Player ${chessMoveDto.playerId} attempting move in game ${chessMoveDto.gameId}: ${chessMoveDto.UCImove}`,
    );

    // Get game data from Redis
    const gameDataString = await this.redisService.get(chessMoveDto.gameId);
    if (!gameDataString) {
      logger.error(`Game not found: ${chessMoveDto.gameId}`);
      throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
    }

    // Parse game state
    const gameStateDto: GameStateDto = plainToInstance(
      GameStateDto,
      JSON.parse(gameDataString),
    );
    const chess = new Chess(gameStateDto.fen);

    // Log game state for debugging
    logger.debug(
      `Game state - Turn: ${gameStateDto.turn}, FEN: ${gameStateDto.fen}`,
    );
    logger.debug(
      `Player roles - White: ${gameStateDto.whitePlayerId}, Black: ${gameStateDto.blackPlayerId}`,
    );
    logger.debug(
      `Current player: ${chessMoveDto.playerId}, Current turn: ${chess.turn()} (${chess.turn() === 'w' ? 'White' : 'Black'})`,
    );

    // Validate player's turn
    const isWhiteMove = chess.turn() === 'w';
    const isCorrectPlayerSendingMove = isWhiteMove
      ? chessMoveDto.playerId === gameStateDto.whitePlayerId
      : chessMoveDto.playerId === gameStateDto.blackPlayerId;

    if (!isCorrectPlayerSendingMove) {
      logger.warn(`Not player ${chessMoveDto.playerId}'s turn`);
      throw new HttpException('Not your turn', HttpStatus.BAD_REQUEST);
    }

    const legalMoves = chess.moves({ verbose: true });
    let moveResult;

    try {
      moveResult = chess.move(chessMoveDto.UCImove);
      logger.log(
        `Move executed successfully: ${JSON.stringify(chessMoveDto.UCImove)}, move object: ${moveResult}`,
      );
    } catch (error) {
      logger.warn(
        `Invalid move attempt: ${chessMoveDto.UCImove}, available moves: ${JSON.stringify(legalMoves.map((m) => `${m.from}-${m.to}`))}`,
      );
      throw new HttpException('Invalid move', HttpStatus.BAD_REQUEST);
    }

    // Check game status
    const gameOverStatusDto = new GameOverStatusDto();
    gameOverStatusDto.isGameOver = chess.isGameOver();
    gameOverStatusDto.isInCheck = chess.inCheck();
    gameOverStatusDto.isInCheckmate = chess.isCheckmate();
    gameOverStatusDto.isInStalemate = chess.isStalemate();
    gameOverStatusDto.isInDraw = chess.isDraw();

    // Update game state
    gameStateDto.gameOverStatus = gameOverStatusDto;
    gameStateDto.turn = chess.turn();
    gameStateDto.fen = chess.fen();
    gameStateDto.pgn = chess.pgn();

    // Save updated game state
    await this.redisService.set(chessMoveDto.gameId, gameStateDto);

    logger.debug(
      `Game state updated: New FEN: ${gameStateDto.fen}, Next turn: ${gameStateDto.turn}`,
    );

    // Handle game over if needed
    if (chess.isGameOver()) {
      logger.log(
        `Game ${chessMoveDto.gameId} is over. Final state: ${JSON.stringify(gameOverStatusDto)}`,
      );
      await this.handleGameOver(chessMoveDto.gameId, chess, gameOverStatusDto);
    }

    return gameStateDto;
  }

  private determineEndReason(gameOverStatus: GameOverStatusDto): string {
    if (gameOverStatus.isInCheckmate) {
      return 'checkmate';
    } else if (gameOverStatus.isInStalemate) {
      return 'stalemate';
    } else if (gameOverStatus.isInDraw) {
      return 'draw';
    } else {
      return 'unknown';
    }
  }

  private async handleGameOver(
    gameId: string,
    chess: Chess,
    gameOverStatus: any,
  ) {
    let outcome: GameOutcome;
    let winMethod: WinMethod;

    if (gameOverStatus.is_in_checkmate) {
      outcome =
        chess.turn() === 'w' ? GameOutcome.BLACK_WIN : GameOutcome.WHITE_WIN;
      winMethod = WinMethod.CHECKMATE;
    } else if (gameOverStatus.is_in_stalemate) {
      outcome = GameOutcome.DRAW;
      winMethod = WinMethod.STALEMATE;
    } else if (chess.isDraw()) {
      outcome = GameOutcome.DRAW;
      if (chess.isInsufficientMaterial()) {
        winMethod = WinMethod.INSUFFICIENT_MATERIAL;
      } else if (chess.isThreefoldRepetition()) {
        winMethod = WinMethod.THREEFOLD_REPETITION;
      } else {
        winMethod = WinMethod.FIFTY_MOVE_RULE;
      }
    }

    // Update game record in database
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: GameStatus.COMPLETED,
        endTime: new Date(),
        finalFen: chess.fen(),
        pgn: chess.pgn(),
        outcome,
        winMethod,
      },
    });
    // Remove game from Redis as it's completed
    await this.redisService.del(gameId);
  }

  async joinGame(gameId: string, userId: string): Promise<void> {
    const logger = new Logger('Join Game');
    logger.log(
      `Attempting to join game - GameID: ${gameId}, UserID: ${userId}`,
    );

    const gameDataString = await this.redisService.get(gameId);
    if (!gameDataString) {
      logger.error(`Game not found in Redis - GameID: ${gameId}`);
      throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
    }

    const gameData = JSON.parse(gameDataString);
    if (gameData.whitePlayerId && gameData.blackPlayerId) {
      throw new HttpException('Game is full', HttpStatus.BAD_REQUEST);
    }

    // Prevent same user from taking both slots
    if (gameData.whitePlayerId === userId) {
      logger.warn(`User attempted to join as both players`, {
        gameId,
        userId,
      });
      throw new HttpException(
        'You are already in this game',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Assign user to an available slot
    let assignedColor = '';
    if (gameData.whitePlayerId === null) {
      gameData.whitePlayerId = userId;
      assignedColor = 'white';
    } else if (gameData.blackPlayerId === null) {
      gameData.blackPlayerId = userId;
      assignedColor = 'black';
    }

    logger.log(`Player assigned to game`, {
      gameId,
      userId,
      assignedColor,
      isWhitePlayer: gameData.whitePlayerId === userId,
      isBlackPlayer: gameData.blackPlayerId === userId,
    });

    // Update Redis
    gameData.status = GameStatus.ACTIVE;
    await this.redisService.set(gameId, gameData);

    // Update PostgreSQL
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        whitePlayerId: gameData.whitePlayerId,
        blackPlayerId: gameData.blackPlayerId,
        status: GameStatus.ACTIVE,
      },
    });
  }

  async getPlayersInfoInCurrentGame(gameId: string) {
    const gameStateDto: GameStateDto = await this.getGameStateFromRedis(gameId);

    const user1 = await this.prisma.user.findFirst({
      where: { id: gameStateDto.whitePlayerId },
      select: {
        id: true,
        user_name: true,
        name: true,
        country: true,
        profile_image_url: true,
        role: true,
      },
    });

    const user2 = await this.prisma.user.findFirst({
      where: { id: gameStateDto.blackPlayerId },
      select: {
        id: true,
        user_name: true,
        name: true,
        country: true,
        profile_image_url: true,
        role: true,
      },
    });

    return {
      player1: user1,
      player2: user2,
    };
  }

  private async getGameStateFromRedis(gameId: string): Promise<GameStateDto> {
    // Get game data from Redis
    const gameDataString = await this.redisService.get(gameId);
    if (!gameDataString) {
      this.logger.error(`Game not found: ${gameId}`);
      throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
    }
    // Parse game state
    const gameStateDto: GameStateDto = plainToInstance(
      GameStateDto,
      JSON.parse(gameDataString),
    );
    return gameStateDto;
  }

  async getEngineMove(gameParameters: ChessEngineRequestDto) {
    const apiUrl = 'http://127.0.0.1:8000/engine/best-move'; // FastAPI URL

    try {
      const response = await this.httpService
        .post(apiUrl, gameParameters)
        .toPromise();
      const responseData = response.data;

      const engineMoveResponse = new ChessEngineResponseDto();
      engineMoveResponse.moveSan = responseData.moveSan;
      engineMoveResponse.moveUci = responseData.moveUci;
      engineMoveResponse.fenAfter = responseData.fenAfter;
      engineMoveResponse.isGameOver = responseData.isGameOver;
      engineMoveResponse.isCheck = responseData.isCheck;
      engineMoveResponse.isCheckmate = responseData.isCheckmate;

      return engineMoveResponse;
    } catch (error) {
      console.error('Error calling FastAPI:', error);
      throw new InternalServerErrorException('Failed to get the best move');
    }
  }

  /**
   * Handle API errors and throw appropriate HTTP exceptions
   * @param error Error object
   * @param defaultMessage Default error message
   */
  private handleApiError(error: any, defaultMessage: string): never {
    if (error.response) {
      throw new HttpException(
        error.response.data.detail || defaultMessage,
        error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    throw new HttpException(defaultMessage, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
