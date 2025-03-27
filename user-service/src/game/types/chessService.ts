export interface ChessEngineRequest {
  gameId: string;
}

export interface SaveComputerGameRequest {
  gameId: string;
  playerId: string;
  playAs: 'w' | 'b';
}

export interface GameState {
  gameId: string;
  fen: string;
  pgn: string;
  turn: 'w' | 'b';
  whitePlayerId?: string;
  blackPlayerId?: string;
  status: string;
  gameOverStatus?: {
    isGameOver: boolean;
    isInCheck: boolean;
    isInCheckmate: boolean;
    isInStalemate: boolean;
    isInDraw: boolean;
  };
}
