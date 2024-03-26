"use client"
import React, { useState } from 'react'
import { ChevronDown, Clock, Crown, Link, Copy, Check, Gauge } from "lucide-react";
import newChallange from '../../websocket/websockets';

const ChallengeLink = ({ gameHandler }) => {
  const [color, setColor] = useState("white")
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    // get game id from backend when user clicked on copy link
    const newGame = await newChallange(color)
    const gameID = newGame.gameId
    const playerColor = newGame.color
    gameHandler(playerColor, gameID)

    console.log("game id : ", gameID)
    const gameUrl = `http://localhost:3000/room/${gameID}`
    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopied(true);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleColor = (color_: string) => {
    setColor(color_)
    console.log(color)
  }

  return (
    <>
      {/* Componet challange link */}
      < div className=" bg-[#36454F4d] m-2 rounded-2xl flex flex-col items-center px-7 py-4 h-full" >
        <Link className="text-white/80 my-3" size={50} />
        <span className=" text-[#dfdfdf]/80 text-3xl font-medium my-2" >Challenge Link</span>
        <span className="text-[#dfdfdf]/70 my-2">Share link and play with anyone.</span>
        {/* Time control */}
        <div className="  flex justify-center relative bg-[#272A30] w-full h-16 my-3 rounded-md items-center">
          <div className=" flex text-purple-500 gap-x-4 ">
            <Clock size={30} />
            <span className=" text-2xl text-white/80">10 min</span>
          </div>
          <ChevronDown className="text-white/60 absolute right-0 mx-3" size={35} />
        </div>
        {/* color select */}
        <div className=" flex gap-1 items-center justify-between w-full">
          <span className=" text-white/80 text-2xl"> Play as</span>
          <div className="flex ">
            {/* white */}
            <button
              onClick={() => handleColor("white")}
              className={` border-2  hover:border-purple-600 ${color === "white" ? "border-purple-600" : "border-transparent"}`}>
              <div className={` w-16 h-16 bg-white flex justify-center items-center border m-1  `}>
                <Crown size={50} />
              </div>
            </button>
            {/* black */}
            <button
              onClick={() => handleColor("black")}
              className={` border-2  hover:border-purple-600 ${color === "black" ? "border-purple-600" : "border-transparent"}`}>
              <div className="w-16 h-16 bg-black flex justify-center items-center text-white border m-1">
                <Crown size={50} />
              </div>
            </button>
            {/* random */}
            <button
              onClick={() => handleColor("random")}
              className={` border-2 hover:border-purple-600 ${color === "random" ? "border-purple-600" : "border-transparent"}`}>
              <div className="flex relative border m-1  ">
                <div className="w-8 h-16 bg-white"></div>
                <div className="w-8 h-16 bg-black"></div>
              </div>
            </button>
          </div>
        </div>
        {/* copy link */}
        < button
          onClick={() => handleCopy()}
          disabled={copied} // NOTE: if copied is true then button will be disabled to prevent multiple createchallange request to server
          className=" flex justify-center items-center w-full h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md my-3 hover:from-blue-500/70 hover:to-purple-600/70 " >
          {
            !copied ? (
              <div className=" flex gap-2 text-white">
                <Copy strokeWidth={2.5} size={35} />
                <span className=" text-white text-2xl font-medium">
                  Copy link
                </span>
              </div>
            ) : (
              <div className="flex gap-2">
                <span className=" text-white text-2xl font-medium">Link copied </span>
                <Check size={30} color='white' />
              </div>
            )
          }
        </button >
      </div >
    </>
  )
}

export default ChallengeLink