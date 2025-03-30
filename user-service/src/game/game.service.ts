import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
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
import { GameState } from './types/chessService';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GameService {
  private readonly logger = new Logger('game service');
  private readonly chessServiceUrl = `${process.env.CHESS_SERVICE_URL?.startsWith('http') ? process.env.CHESS_SERVICE_URL : `http://${process.env.CHESS_SERVICE_URL || 'localhost'}`}:8000`;

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
        .post(`${this.chessServiceUrl}/engine/save-game-in-redis`, {
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
          `${this.chessServiceUrl}/engine/move/player`,
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
          `${this.chessServiceUrl}/engine/move/computer`,
          { gameId },
        ),
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'Computer move failed');
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
