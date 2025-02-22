type ChessMove = {
  symbol: string;
  square: string;
  moveType: string;
};

const convertMoveToSymbol = (move: string): ChessMove => {
  // TODO: handle castling for black side  [ ] 

  const chessPieces: Record<string, string> = {
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: " ", // White Pieces
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: " "  // Black Pieces 
  };

  if (move === "O-O") return { symbol: "♔", square: "O-O", moveType: "Castling (Kingside)" };
  if (move === "O-O-O") return { symbol: "♔", square: "O-O-O", moveType: "Castling (Queenside)" };

  let moveType: string = "Normal Move";
  if (move.includes("x")) moveType = "Capture";
  if (move.includes("=")) moveType = "Pawn Promotion";
  if (move.includes("#")) moveType = "Checkmate";
  else if (move.includes("+")) moveType = "Check";

  const pieceType: string = move.match(/[KQRBNkqrbn]/) ? move.match(/[KQRBNkqrbn]/)![0] : "P"; // Default to Pawn
  let square: string = move.length === 2 ? move : move.slice(1);

  return {
    symbol: chessPieces[pieceType],
    square: square,
    moveType: moveType
  };
};

export default convertMoveToSymbol;
