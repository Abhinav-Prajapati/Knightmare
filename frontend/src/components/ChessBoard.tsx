import React from "react";
import { Chessboard } from "react-chessboard";

interface ChessBoardProps {
  gameFen: any;
  playerColor: any;
  handlePieceDrop: any;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ gameFen, playerColor, handlePieceDrop }) => {
  return (
    <div className=" w-[50%] bg-gradient-to-tr to-[#A348DF] from-[#7143E2] rounded-2xl">
      <div className=" p-6 my-5 mx-8  rounded-2xl bg-[#D9D9D933] backdrop-blur-md innter ">
        <Chessboard
          id="BasicBoard"
          onPieceDrop={handlePieceDrop}
          position={gameFen}
          boardOrientation={playerColor.toLowerCase()}
          customDarkSquareStyle={{ backgroundColor: "#D9D9D933" }}
          customLightSquareStyle={{ backgroundColor: "#ffffffb3" }}
        />
      </div>
    </div>
  );
};

export default ChessBoard;
