import { v4 as uuidv4 } from 'uuid';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Chess } from 'chess.js';
import { RedisService } from '../redis.service';
import { PrismaService } from '../prisma.service';
import { GameStatus, GameOutcome, WinMethod } from '@prisma/client';

@Injectable()
export class GameService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) { }

  private generateGameId(): string {
    return `game_${uuidv4()}`;
  }

  async createGame(creatorUserId: string): Promise<string> {
    const gameId = this.generateGameId();
    const chess = new Chess();

    // Create game record in PostgreSQL
    const _ = await this.prisma.game.create({
      data: {
        id: gameId,
        whitePlayerId: creatorUserId,
        status: GameStatus.WAITING,
        initialFen: chess.fen(),
      },
    });

    // Store active game state in Redis
    const gameData = {
      player1: creatorUserId,
      player2: null,
      turn: 'white',
      fen: chess.fen(),
      pgn: chess.pgn(),
      move_history: chess.history(),
      status: 'waiting',
    };

    await this.redisService.set(gameId, gameData);
    return gameId;
  }

  async getGameState(gameId: string) {
    const gameDataString = await this.redisService.get(gameId);
    if (!gameDataString) {
      // Check if game exists in database
      const dbGame = await this.prisma.game.findUnique({
        where: { id: gameId },
      });

      if (!dbGame) {
        throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
      }

      // If game is completed, return final state
      if (dbGame.status === GameStatus.COMPLETED) {
        return {
          fen: dbGame.finalFen,
          pgn: dbGame.pgn,
          status: dbGame.status,
          outcome: dbGame.outcome,
          winMethod: dbGame.winMethod,
        };
      }
    }

    const gameData = JSON.parse(gameDataString);
    const chess = new Chess(gameData.fen);

    const gameOverStatus = {
      is_gameover: chess.isGameOver(),
      is_in_check: chess.inCheck(),
      is_in_checkmate: chess.isCheckmate(),
      is_in_stalemate: chess.isStalemate(),
      is_in_draw: chess.isDraw(),
    };

    // If game is over, update the database
    if (gameOverStatus.is_gameover) {
      await this.handleGameOver(gameId, chess, gameOverStatus);
    }

    return {
      fen: chess.fen(),
      legal_moves: chess.moves(),
      move_history: gameData.move_history,
      turn: chess.turn(),
      game_over_status: gameOverStatus,
    };
  }

  async makeMove(
    gameId: string,
    move_from: string,
    move_to: string,
    promotion: string = null,
  ) {
    const gameDataString = await this.redisService.get(gameId);
    if (!gameDataString) {
      throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
    }

    const gameData = JSON.parse(gameDataString);
    const chess = new Chess(gameData.fen);

    // Validate move
    const legalMoves = chess.moves({ verbose: true });
    const isLegalMove = legalMoves.some(
      (legalMove) =>
        legalMove.from === move_from &&
        legalMove.to === move_to &&
        (!promotion || legalMove.promotion === promotion),
    );

    if (!isLegalMove) {
      throw new HttpException('Invalid move', HttpStatus.BAD_REQUEST);
    }

    const move = promotion
      ? { from: move_from, to: move_to, promotion }
      : { from: move_from, to: move_to };

    chess.move(move);

    const updatedGameData = {
      ...gameData,
      turn: chess.turn() === 'w' ? 'white' : 'black',
      fen: chess.fen(),
      pgn: chess.pgn(),
      move_history: [...gameData.move_history, move],
    };

    await this.redisService.set(gameId, updatedGameData);

    // Check if game is over after the move
    if (chess.isGameOver()) {
      await this.handleGameOver(gameId, chess, {
        is_gameover: true,
        is_in_check: chess.inCheck(),
        is_in_checkmate: chess.isCheckmate(),
        is_in_stalemate: chess.isStalemate(),
        is_in_draw: chess.isDraw(),
      });
    }

    return {
      fen: updatedGameData.fen,
    };
  }

  private async handleGameOver(
    gameId: string,
    chess: Chess,
    gameOverStatus: any,
  ) {
    let outcome: GameOutcome;
    let winMethod: WinMethod;

    if (gameOverStatus.is_in_checkmate) {
      outcome = chess.turn() === 'w' ? GameOutcome.BLACK_WIN : GameOutcome.WHITE_WIN;
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
    const gameDataString = await this.redisService.get(gameId);
    if (!gameDataString) {
      throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
    }

    const gameData = JSON.parse(gameDataString);
    if (gameData.player2) {
      throw new HttpException('Game is full', HttpStatus.BAD_REQUEST);
    }

    // Update Redis
    gameData.player2 = userId;
    gameData.status = 'active';
    await this.redisService.set(gameId, gameData);

    // Update PostgreSQL
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        blackPlayerId: userId,
        status: GameStatus.ACTIVE,
      },
    });
  }
}
