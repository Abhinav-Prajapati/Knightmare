'use client'
import ChessBoard from "@/components/ChessBoard";
import ChallengeLink from "@/components/ChallengeLInk";
import Chat from "@/components/Chat";
import GameButtons from "@/components/GameButtons";
import SideMenu from "@/components/SideMenu";
import MoveHistory from "@/components/MoveHistory";

const WebSocketComponent: React.FC = () => {

  return (
    <>
      <div className=" flex justify-around ">
        <div className=" w-[25vw]  border">
        </div>
        <div className=" flex   ">
          <ChessBoard
            gameFen={"rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}
            playerColor={"white"}
            handlePieceDrop={() => { }}
          />
        </div>
        <div className=" w-[25vw]  h-[93vh] px-5  flex flex-col  justify-between">
          <div className=" flex flex-col  w-full h-[90%] gap-3  ">
            <MoveHistory moves={["e1e2", "f5f3"]} />
            <Chat />
          </div>
          <div className=" h-[7%] justify-center flex flex-col  ">
            <GameButtons />
          </div>
        </div>
      </div>
    </>
  );
};

export default WebSocketComponent;