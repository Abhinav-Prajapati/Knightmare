"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Chessboard } from "react-chessboard";
import ChessBoard from "@/components/ChessBoard";
import { ChevronDown, Clock, Crown, Link, Shuffle, Clipboard, Copy } from "lucide-react";
import ChallengeLink from "@/components/ChallengeLInk";


const WebSocketComponent: React.FC = () => {
  const [msgToSend, setmsgToSend] = useState("");
  const [socketData, setSocketData] = useState<string>("recived data form websocket");
  const [conn, setConn] = useState<WebSocket | null>(null);
  const [uuid, setUuid] = useState("No game");
  const [gameFen, setGameFen] = useState();
  const [playerColor, setPlayerColor] = useState<string>("white");
  //
  const [player2, setplayer2] = useState("wating for player to join");

  const newGame = async () => {
    // setUuid(msgToSend);
    try {
      let response = await axios.post(
        `http://localhost:8080/newgame/${msgToSend}`,
        { side: playerColor } // send player color as json body
      );

      if (response.status === 200) {
        console.log("New game created successfully");

        // socket
        const socket = new WebSocket(
          `ws://localhost:8080/player1/${msgToSend}`
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
          if (data.Type === "join") {
            setplayer2(data.Content);
          }
          setSocketData(event.data);
          console.log(socketData);
        };
        socket.onclose = () => {
          console.log("WebSocket disconnected");
        };
        // handle closing of socket
      } else {
        console.error("Failed to create new game:", response.statusText);
        // Handle error response here
      }
    } catch (error) {
      console.error("Error creating new game:", error);
      // Handle any other errors here
    }
  };

  const joinGame = async () => {
    let response = await axios.get(
      `http://192.168.0.110:8080/joingame/${msgToSend}`
    );
    console.log(response);
    setPlayerColor(response.data["side"]);

    // socket
    const socket = new WebSocket(
      `ws://192.168.0.110:8080/player2/${msgToSend}`
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
      setSocketData(event.data);
      console.log(socketData);
    };
    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };
  };

  // handle closing of socket

  const handlePieceDrop = (from: string, to: string) => {
    conn?.send(`${from}${to}`);
    setGameFen(gameFen);
    return true;
  };

  const selectPlayerColor = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedColor = event.target.value;
    setPlayerColor(selectedColor);
  };

  return (
    <div className=" flex ">
      <ChessBoard
        gameFen={gameFen}
        playerColor={playerColor}
        handlePieceDrop={handlePieceDrop}
      />
      <ChallengeLink />

      <div className=" flex flex-col gap-2  h-full pl-4 text-white ">
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

        <div className=" flex flex-col pt-2  border rounded-md text-lg px-3 py-2">
          <h1 className=" ">Data recived from server : </h1>
          <p className=" border border-black text-neutral-400 ">{socketData}</p>
        </div>
        <span className=" border p-3 rounded-md">Game code : {msgToSend}</span>
      </div>
    </div>
  );
};

export default WebSocketComponent;
