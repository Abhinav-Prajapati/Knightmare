'use client'
import Chat from '@/components/Chat';
import ChessBoard from '@/components/ChessBoard'
import GameButtons from '@/components/GameButtons';
import MoveHistory from '@/components/MoveHistory';
import Navbar from '@/components/Navbar';
import React, { useEffect, useState } from 'react'

interface PageProps {
  params: {
    gameId: string;
  };
}

const page: React.FC<PageProps> = ({ params: { gameId } }) => {


  const handlePieceDrop = (from: string, to: string) => {
    console.log("from: ", from, "to: ", to)
    return true;
  };

  return (
    <>
      <Navbar />
      <div className=" flex justify-around ">
        <div className=" w-[25vw]  border text-white">
          game id : {gameId}
        </div>
        <div className=" flex  h-max  ">
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
  )
}

export default page
