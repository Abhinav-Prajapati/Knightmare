"use client";
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
  highlightedSquares = {},
}) => {
  const lightSquareColor = "#ffffffb3";
  const darkSquareColor = "#D9D9D933";

  return (
    <div className="relative rounded-sm h-max w-max p-4">
      {/* Blurred Background */}
      <div className="absolute inset-0 bg-gradient-to-tr to-[#4e3e51]/80 from-[#c47373]/80 z-[-1] backdrop-blur-sm"></div>

      {/* Chessboard (on top) */}
      <div className="relative z-10 p-4 rounded-sm border h-max w-max">
        <Chessboard
          id="BasicBoard"
          onPieceDrop={handlePieceDrop}
          position={gameFen}
          boardOrientation={playerColor.toLowerCase()}
          customDarkSquareStyle={{ backgroundColor: darkSquareColor }}
          customLightSquareStyle={{ backgroundColor: lightSquareColor }}
          customSquareStyles={highlightedSquares} // 🔥 Apply highlight styles
          boardWidth={830}
        />
      </div>
    </div>
  );
};

export default ChessBoard;
