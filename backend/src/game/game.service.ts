import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Chess } from 'chess.js';
import { RedisService } from '../redis.service';
import { PrismaService } from '../prisma.service';
import { GameStatus, GameOutcome, WinMethod } from '@prisma/client';
import { GameStateDto } from './dto/game.dto';
import { PlayerColor } from './enums/game.enums';

@Injectable()
export class GameService {
  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) { }

  private generateGameId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let randomStr = '';
    for (let i = 0; i < 5; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `g_${randomStr}`;
  }

  async createGame(creatorUserId: string, playerColor: PlayerColor): Promise<string> {
    const logger = new Logger(GameService.name);
    
    const gameId = this.generateGameId();
    const chess = new Chess();

    // Determine player positions based on `play_as`
    const whitePlayerId = playerColor === PlayerColor.WHITE ? creatorUserId : null;
    const blackPlayerId = playerColor === PlayerColor.BLACK ? creatorUserId : null;

    // Store active game state in Redis
    const gameStateDto = new GameStateDto()
    gameStateDto.gameId = gameId
    gameStateDto.fen = chess.fen()
    gameStateDto.pgn = chess.pgn()
    gameStateDto.turn = chess.turn()
    gameStateDto.moveHistory = chess.history()
    gameStateDto.whitePlayerId = whitePlayerId
    gameStateDto.blackPlayerId = blackPlayerId
    gameStateDto.status = GameStatus.WAITING

    // Create game record in PostgreSQL
    const _ = await this.prisma.game.create({
      data: {
        id: gameStateDto.gameId,
        whitePlayerId: gameStateDto.whitePlayerId,
        blackPlayerId: gameStateDto.blackPlayerId,
        status: gameStateDto.status,
        initialFen: gameStateDto.fen,
      },
    });

    await this.redisService.set(gameId, gameStateDto);

    logger.log(`game created and saved to Postgres and redis. Game ID: ${gameStateDto.gameId}`)
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
      game_over_status: gameOverStatus,
      turn: chess.turn(),
      white_player_id: gameData.whitePlayerId,
      black_player_id: gameData.blackPlayerId,
    };
  }

  async makeMove(
    playerId: string,
    gameId: string,
    move_from: string,
    move_to: string,
    promotion: string = null,
  ) {
    const logger = new Logger('Make Move');
    logger.log(`Player ${playerId} attempting move in game ${gameId}: ${move_from} -> ${move_to}${promotion ? ` with promotion: ${promotion}` : ''}`);

    const gameDataString = await this.redisService.get(gameId);
    if (!gameDataString) {
      logger.error(`Game not found: ${gameId}`);
      throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
    }

    const gameData = JSON.parse(gameDataString);
    const chess = new Chess(gameData.fen);
    const turn = chess.turn();

    logger.debug(`Game state - Turn: ${turn}, FEN: ${gameData.fen}`);
    logger.debug(`Player roles - White: ${gameData.whitePlayerId}, Black: ${gameData.blackPlayerId}`);
    logger.debug(`Current player: ${playerId}, Current turn: ${turn} (${turn === 'w' ? 'White' : 'Black'})`);

    // Check if it's the player's turn with detailed logging
    const isWhiteMove = turn === 'w';
    const isCorrectPlayer = isWhiteMove ?
      playerId === gameData.whitePlayerId :
      playerId === gameData.blackPlayerId;

    if (!isCorrectPlayer) {
      logger.warn('Not your turn');
      return
    }

    // Validate move
    const legalMoves = chess.moves({ verbose: true });
    logger.debug(`Legal moves count: ${legalMoves.length}`);

    const isLegalMove = legalMoves.some(
      (legalMove) =>
        legalMove.from === move_from &&
        legalMove.to === move_to &&
        (!promotion || legalMove.promotion === promotion),
    );

    if (!isLegalMove) {
      logger.warn(
        `Invalid move attempt:
            - From: ${move_from}
            - To: ${move_to}
            - Promotion: ${promotion || 'none'}
            - Available moves: ${JSON.stringify(legalMoves.map(m => `${m.from}-${m.to}`))}`
      );
      throw new HttpException('Invalid move', HttpStatus.BAD_REQUEST);
    }

    const move = promotion
      ? { from: move_from, to: move_to, promotion }
      : { from: move_from, to: move_to };

    chess.move(move);
    logger.log(`Move executed successfully: ${JSON.stringify(move)}`);

    const updatedGameData = {
      ...gameData,
      turn: chess.turn() === 'w' ? 'white' : 'black',
      fen: chess.fen(),
      pgn: chess.pgn(),
      move_history: [...gameData.move_history, ...chess.history()],
    };

    await this.redisService.set(gameId, updatedGameData);
    logger.debug(
      `Game state updated:
        - New FEN: ${updatedGameData.fen}
        - PGN: ${updatedGameData.pgn}
        - Next turn: ${updatedGameData.turn}`
    );

    // Check if game is over after the move
    if (chess.isGameOver()) {
      logger.log(`Game ${gameId} is over. Checking final state...`);
      const gameState = {
        is_gameover: true,
        is_in_check: chess.inCheck(),
        is_in_checkmate: chess.isCheckmate(),
        is_in_stalemate: chess.isStalemate(),
        is_in_draw: chess.isDraw(),
      };
      logger.log(`Game over state: ${JSON.stringify(gameState)}`);
      await this.handleGameOver(gameId, chess, gameState);
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
    // await this.redisService.del(gameId);
  }

  async joinGame(gameId: string, userId: string): Promise<void> {

    const logger = new Logger('Join Game');
    logger.log(`Attempting to join game - GameID: ${gameId}, UserID: ${userId}`);

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
        userId
      });
      throw new HttpException('You are already in this game', HttpStatus.BAD_REQUEST);
    }

    // Assign user to an available slot
    let assignedColor = '';
    if (gameData.whitePlayerId === null) {
      gameData.whitePlayerId = userId;
      assignedColor = 'white';
    } else if (gameData.blackPlayerId === null) {
      gameData.blackPlayerId = userId;
      assignedColor = 'black'
    }

    logger.log(`Player assigned to game`, {
      gameId,
      userId,
      assignedColor,
      isWhitePlayer: gameData.whitePlayerId === userId,
      isBlackPlayer: gameData.blackPlayerId === userId
    });

    // Update Redis
    gameData.status = 'active';
    await this.redisService.set(gameId, gameData);

    console.log(gameData)

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
}
