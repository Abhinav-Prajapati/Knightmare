"use client";
import React, { useEffect, useState } from "react";
import ChessBoard from "@/components/ChessBoard";
import ChallengeLink from "@/components/ChallengeLInk";
import MoveHistory from "@/components/MoveHistory";
import Chat from "@/components/Chat";


const WebSocketComponent: React.FC = () => {
  const [msgToSend, setmsgToSend] = useState("");
  const [socketData, setSocketData] = useState<string>("socket data");
  const [conn, setConn] = useState<WebSocket | null>(null);
  const [uuid, setUuid] = useState("No game");
  const [gameFen, setGameFen] = useState();
  const [playerColor, setPlayerColor] = useState<string>("white");
  const [moveHistory, setMoveHistory] = useState<string[] | undefined>();


  const startGame = async (color: string, gameID: string) => {
    setPlayerColor(color);
    // socket
    const socket = new WebSocket(
      `ws://localhost:8080/player1/${gameID}`
    ); // Replace with your WebSocket server URL
    setConn(socket);
    socket.onopen = () => {
      console.log("WebSocket connected");
    };
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.Type === "FEN") {
        setGameFen(data.Content);
      }
      if (data.type === "move") {
        setMoveHistory(data.moves)
        console.log("move history ", moveHistory);
      }
      setSocketData(event.data);
    };
    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };
  };

  useEffect(() => {
    console.log("Updated move history:", moveHistory);
  }, [moveHistory]);

  const handlePieceDrop = (from: string, to: string) => {
    conn?.send(`${from}${to}`);
    setGameFen(gameFen);
    return true;
  };

  return (
    <>
      <div className=" flex ">
        <ChessBoard
          gameFen={gameFen}
          playerColor={playerColor}
          handlePieceDrop={handlePieceDrop}
        />
        <div className=" flex flex-col w-[25%]">
          <MoveHistory moves={moveHistory} />
          {
            false ? (
              <ChallengeLink gameHandler={startGame} />
            ) : (
              <Chat />
            )
          }
        </div>
      </div>

      <div className=" flex flex-col gap-2  h-full pl-4 text-white w-1/2 mt-20 ">
        {/* Send data to WebSocket */}
        <div className=" flex  items-center border w-max rounded-md ">
          <input
            type="text"
            onChange={(event) => {
              setmsgToSend(event.target.value);
            }}
            className=" bg-black rounded-md h-10 px-3 text-lg"
            placeholder="Send to WebSocket "
          />
          <button
            onClick={() => {
              conn?.send(msgToSend);
            }}
            className=" p-3 text-2xl bg-purple-500 "
          >
            Send
          </button>
        </div>

        <div className=" flex flex-col pt-2  border rounded-md text-lg px-3 py-2 h-full">
          <h1 className=" ">Data recived from server : </h1>
          <p className=" border border-black text-neutral-400 text-wrap ">{socketData}</p>
        </div>
        <span className=" border p-3 rounded-md">Game code : {msgToSend}</span>
      </div>
    </>
  );
};

export default WebSocketComponent;
