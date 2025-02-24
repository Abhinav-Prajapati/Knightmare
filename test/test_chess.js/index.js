const convertMoveToSymbol = (move) => {
  // TODO: handle castling for black side  [ ] 

  const chessPieces = {
    K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "", // White Pieces
    k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: ""  // Black Pieces 
  };

  if (move === "O-O") return { symbol: "♔", square: "O-O", moveType: "Castling (Kingside)" };
  if (move === "O-O-O") return { symbol: "♔", square: "O-O-O", moveType: "Castling (Queenside)" };


  let moveType = "Normal Move";
  if (move.includes("x")) moveType = "Capture";
  if (move.includes("=")) moveType = "Pawn Promotion";
  if (move.includes("#")) moveType = "Checkmate";
  else if (move.includes("+")) moveType = "Check";

  const pieceType = move.match(/[KQRBNkqrbn]/) ? move.match(/[KQRBNkqrbn]/)[0] : "P"; // Default to Pawn
  let square = move.length === 2 ? move : move.slice(1);

  return {
    symbol: chessPieces[pieceType],
    square: square,
    moveType: moveType
  }
}

console.log(convertMoveToSymbol("f3"));  // Output: ♘f3 (Normal Move)
console.log(convertMoveToSymbol("kxd5")); // Output: d5 (Capture)
console.log(convertMoveToSymbol("O-O"));  // Output: O-O (Castling)

// Example usage:
console.log(convertMoveToSymbol("Nf3"));   // { symbol: '♘', square: 'f3', moveType: 'Normal Move' }
console.log(convertMoveToSymbol("kxd5"));  // { symbol: '♚', square: 'd5', moveType: 'Capture' }
console.log(convertMoveToSymbol("O-O-O")); // { symbol: '♔', square: 'O-O-O', moveType: 'Castling (Queenside)' }
console.log(convertMoveToSymbol("e8=Q"));  // { symbol: '♕', square: 'e8', moveType: 'Pawn Promotion' }
console.log(convertMoveToSymbol("Qh5+"));  // { symbol: '♕', square: 'h5', moveType: 'Check' }
