"use client";
// TODO: add enalbe flag to block all peacs before game starts
import { Chess, DEFAULT_POSITION } from 'chess.js'
import React, { useEffect, useRef, useState } from "react";
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

  const chessRef = useRef(new Chess())
  const [fen, setFen] = useState<string>(DEFAULT_POSITION)

  const lightSquareColor = "#ffffffb3";
  const darkSquareColor = "#D9D9D933";

  useEffect(() => {
    chessRef.current.load(gameFen)
    setFen(chessRef.current.fen())
    console.log(`new fen recived from socket ${gameFen}`)
  }, [gameFen])

  const optmesticFenUpdate = (from: string, to: string, promotion?: string) => {
    console.log(`move recived ${from}->${to} P:${promotion}`)
    chessRef.current.move(`${from}${to}${promotion}`)
    setFen(chessRef.current.fen());
    handlePieceDrop(from, to, promotion);
    return true
  }

  return (
    <div className="relative rounded-sm h-max w-max p-4">
      {/* Blurred Background */}
      <div className="absolute inset-0 bg-gradient-to-tr to-[#4e3e51]/80 from-[#c47373]/80 z-[-1] backdrop-blur-sm"></div>

      {/* Chessboard (on top) */}
      <div className="relative z-10 p-4 rounded-sm border h-max w-max">
        <Chessboard
          id="BasicBoard"
          onPieceDrop={optmesticFenUpdate}
          position={fen}
          boardOrientation={playerColor.toLowerCase()}
          customDarkSquareStyle={{ backgroundColor: darkSquareColor }}
          customLightSquareStyle={{ backgroundColor: lightSquareColor }}
          customSquareStyles={highlightedSquares} // 🔥 Apply highlight styles
          boardWidth={790}
        />
      </div>
    </div>
  );
};

export default ChessBoard;