'use client'
import ChessBoard from "@/components/ChessBoard";
import ChallengeLink from "@/components/ChallengeLInk";
import Chat from "@/components/Chat";
import GameButtons from "@/components/GameButtons";
import SideMenu from "@/components/SideMenu";
import Navbar from "@/components/Navbar";

const WebSocketComponent: React.FC = () => {

  return (
    <>
      <Navbar />
      <div className=" flex  justify-between">
        <div className=" w-full  border">
          <SideMenu />
        </div>
        <div className=" flex  ">
          <ChessBoard
            gameFen={"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}
            playerColor={"white"}
            handlePieceDrop={() => { }}
          />
        </div>
        <div className="w-full border"></div>
      </div>
    </>
  );
};

export default WebSocketComponent;