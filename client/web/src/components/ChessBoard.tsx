"use client"
import React from "react";
import { Chessboard } from "react-chessboard";

interface ChessBoardProps {
  gameFen: any;
  playerColor: any;
  handlePieceDrop?: any;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ gameFen, playerColor, handlePieceDrop }) => {
  const lightSquareColor = "#ffffffb3"  
  const darkSquareColor = "#D9D9D933"
  return (
    <div className="bg-gradient-to-tr to-[#A348DF] from-[#7143E2] rounded-2xl xl:w-[47.5vw] h-max  ">
      <div className=" p-6 my-5 mx-8  rounded-2xl bg-[#D9D9D933] backdrop-blur-md innter ">
        <Chessboard
          id="BasicBoard"
          onPieceDrop={handlePieceDrop}
          position={gameFen}
          boardOrientation={playerColor.toLowerCase()}
          customDarkSquareStyle={{ backgroundColor: darkSquareColor  }}
          customLightSquareStyle={{ backgroundColor:  lightSquareColor  }}
        />
      </div>
    </div>
  );
};

export default ChessBoard;