"use client"
import React from "react";
import { Chessboard } from "react-chessboard";

interface ChessBoardProps {
  gameFen: any;
  playerColor: any;
  handlePieceDrop?: any;
  highlightedSquares?: Record<string, React.CSSProperties>; // ✅ Ensure object type
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  gameFen,
  playerColor,
  handlePieceDrop,
  highlightedSquares = {}
}) => {
  const lightSquareColor = "#ffffffb3"
  const darkSquareColor = "#D9D9D933"
  return (
    <div className="bg-gradient-to-tr to-[#A348DF] from-[#7143E2] rounded-2xl h-full p-4">
      <div className="p-4 rounded-2xl border">
        <Chessboard
          id="BasicBoard"
          onPieceDrop={handlePieceDrop}
          position={gameFen}
          boardOrientation={playerColor.toLowerCase()}
          customDarkSquareStyle={{ backgroundColor: darkSquareColor }}
          customLightSquareStyle={{ backgroundColor: lightSquareColor }}
          customSquareStyles={highlightedSquares} // 🔥 Apply highlight styles
          boardWidth={800} // TODO: change this dynamically
        />
      </div >
    </div>
  );
};

export default ChessBoard;
