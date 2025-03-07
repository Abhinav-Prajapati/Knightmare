'use client'
import ChessBoard from "@/components/ChessBoard";
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
        </div>
        <div className="w-full border"></div>
      </div>
    </>
  );
};

export default WebSocketComponent;
