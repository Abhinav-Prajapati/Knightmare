'use client'
import ChessBoard from '@/components/ChessBoard'
import MoveHistory from '@/components/MoveHistory'
import Navbar from '@/components/Navbar';
import axios from 'axios';
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
      <div className=" flex ">
        <ChessBoard
          gameFen={"rn1qkbnr/pppbpppp/8/3p4/8/5P2/PPPP2PP/RNBQKBNR w KQkq - 0 3"}
          playerColor={'black'}
          handlePieceDrop={handlePieceDrop}
        />
        <div className=" flex flex-col w-[25%]">
          <div className="text-white">{gameId}</div>
        </div>
      </div>
    </>
  )
}

export default page
