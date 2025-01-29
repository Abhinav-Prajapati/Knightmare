import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Chess } from 'chess.js';

@Injectable()
export class GameService {
  GAMES = {};

  async createNewGame() {
    const id = uuidv4();
    const chess = new Chess();
    this.GAMES['a'] = chess; // TODO: change it to id later
    return { game_id: id };
  }

  async getGameState(gameId: string) {
    const chess = this.GAMES[gameId];
    if (!chess) {
      throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
    }

    const fen = chess.fen();
    const leagalMoves = chess.moves();
    const moveHistory = chess.history();
    const turn = chess.turn();
    const gameOverStatus = {
      is_gameover: chess.isGameOver(),
      is_in_check: chess.inCheck(),
      is_in_checkmate: chess.isCheckmate(),
      is_in_stalemate: chess.isStalemate(),
      is_in_draw: chess.isDraw(),
    };

    return {
      fen: fen,
      leagal_moves: leagalMoves,
      move_history: moveHistory,
      turn: turn,
      game_over_status: gameOverStatus,
    };
  }

  async makeMove(
    gameId: string,
    move_from: string,
    move_to: string,
    promotion: string = null,
  ) {
    const chess = this.GAMES[gameId];
    if (!chess) {
      throw new HttpException('Game not found', HttpStatus.NOT_FOUND);
    }

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

    return {
      message: 'moved',
    };
  }
}
