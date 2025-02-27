import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Chess } from 'chess.js';
import { RedisService } from '../redis.service';
import { PrismaService } from '../prisma.service';
import { GameStatus, GameOutcome, WinMethod } from '@prisma/client';
import { GameOverStatusDto, GameStateDto } from './dto/game.dto';
import { PlayerColor } from './enums/game.enums';
import { plainToInstance } from 'class-transformer';
import { ChessMoveDto } from './dto/send-move.dto';

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

    const gameOverStatusDto = new GameOverStatusDto()
    gameOverStatusDto.isGameOver = chess.isGameOver()
    gameOverStatusDto.isInCheck = chess.isCheck()
    gameOverStatusDto.isInCheckmate = chess.isCheckmate()
    gameOverStatusDto.isInStalemate = chess.isStalemate()
    gameOverStatusDto.isInDraw = chess.isDraw()

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
    gameStateDto.gameOverStatus = gameOverStatusDto

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
      throw new HttpException('Game not found in redis', HttpStatus.NOT_FOUND);
    }
    const gameStateDto: GameStateDto = plainToInstance(GameStateDto, JSON.parse(gameDataString));
    return gameStateDto
  }

  async makeMove(chessMoveDto: ChessMoveDto): Promise<{ fen: string, gameOverStatus?: GameOverStatusDto }> {
    const logger = new Logger('Make Move');
    logger.log(`Player ${chessMoveDto.playerId} attempting move in game ${chessMoveDto.gameId}: ${chessMoveDto.moveFrom} -> ${chessMoveDto.moveTo}${chessMoveDto.promotion ? ` with promotion: ${chessMoveDto.promotion}` : ''}`);

    // Get game data from Redis
    const gameDataString = await this.redisService.get(chessMoveDto.gameId);
    if (!gameDataString) {
      logger.error(`Game not found: ${chessMoveDto.gameId}`);
      throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
    }

    // Parse game state
    const gameStateDto: GameStateDto = plainToInstance(GameStateDto, JSON.parse(gameDataString));
    const chess = new Chess(gameStateDto.fen);

    // Log game state for debugging
    logger.debug(`Game state - Turn: ${gameStateDto.turn}, FEN: ${gameStateDto.fen}`);
    logger.debug(`Player roles - White: ${gameStateDto.whitePlayerId}, Black: ${gameStateDto.blackPlayerId}`);
    logger.debug(`Current player: ${chessMoveDto.playerId}, Current turn: ${chess.turn()} (${chess.turn() === 'w' ? 'White' : 'Black'})`);

    // Validate player's turn
    const isWhiteMove = chess.turn() === 'w';
    const isCorrectPlayerSendingMove = isWhiteMove
      ? chessMoveDto.playerId === gameStateDto.whitePlayerId
      : chessMoveDto.playerId === gameStateDto.blackPlayerId;

    if (!isCorrectPlayerSendingMove) {
      logger.warn(`Not player ${chessMoveDto.playerId}'s turn`);
      throw new HttpException('Not your turn', HttpStatus.BAD_REQUEST);
    }

    // Extract move details
    const { moveFrom, moveTo, promotion } = chessMoveDto;

    // Validate move
    const legalMoves = chess.moves({ verbose: true });
    const isLegalMove = legalMoves.some(
      (legalMove) =>
        legalMove.from === moveFrom &&
        legalMove.to === moveTo &&
        (!promotion || legalMove.promotion === promotion),
    );

    if (!isLegalMove) {
      logger.warn(`Invalid move attempt: ${moveFrom}-${moveTo}${promotion ? `-${promotion}` : ''}, available moves: ${JSON.stringify(legalMoves.map(m => `${m.from}-${m.to}`))}`);
      throw new HttpException('Invalid move', HttpStatus.BAD_REQUEST);
    }

    // Execute the move
    const move = promotion
      ? { from: moveFrom, to: moveTo, promotion }
      : { from: moveFrom, to: moveTo };

    chess.move(move);
    logger.log(`Move executed successfully: ${JSON.stringify(move)}`);

    // Check game status
    const gameOverStatusDto = new GameOverStatusDto();
    gameOverStatusDto.isGameOver = chess.isGameOver();
    gameOverStatusDto.isInCheck = chess.inCheck();
    gameOverStatusDto.isInCheckmate = chess.isCheckmate();
    gameOverStatusDto.isInStalemate = chess.isStalemate();
    gameOverStatusDto.isInDraw = chess.isDraw();

    // Update game state
    gameStateDto.gameOverStatus = gameOverStatusDto
    gameStateDto.turn = chess.turn()
    gameStateDto.fen = chess.fen()
    gameStateDto.pgn = chess.pgn()
    gameStateDto.moveHistory = [...gameStateDto.moveHistory, ...chess.history()]

    // Save updated game state
    await this.redisService.set(chessMoveDto.gameId,gameStateDto);
    
    logger.debug(`Game state updated: New FEN: ${gameStateDto.fen}, Next turn: ${gameStateDto.turn}`);

    // Handle game over if needed
    if (chess.isGameOver()) {
      logger.log(`Game ${chessMoveDto.gameId} is over. Final state: ${JSON.stringify(gameOverStatusDto)}`);
      await this.handleGameOver(chessMoveDto.gameId, chess, gameOverStatusDto);
    }

    return {
      fen: gameStateDto.fen,
      gameOverStatus: gameStateDto.gameOverStatus
    };
  }

  /**
   * Helper method to determine the reason for game end
   */
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