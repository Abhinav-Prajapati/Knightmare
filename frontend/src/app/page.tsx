"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Chessboard } from "react-chessboard";
import { useToast } from "@/components/ui/use-toast";

const WebSocketComponent: React.FC = () => {
  const [msgToSend, setmsgToSend] = useState("");
  const [socketData, setSocketData] = useState<string>("");
  const [conn, setConn] = useState<WebSocket | null>(null);
  const [uuid, setUuid] = useState("No game");
  const [gameFen, setGameFen] = useState();
  const [turn, setTurn] = useState(true);
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
    <div className=" flex">
      <div className="w-[42vw] p-4">
        <Chessboard
          id="BasicBoard"
          onPieceClick={(piece) => console.log(piece)}
          onSquareClick={(square) => console.log(`Clicked square ${square}`)}
          onPieceDrop={handlePieceDrop}
          position={gameFen}
          boardOrientation={playerColor.toLowerCase()}
        />
      </div>

      <div className=" flex flex-col gap-2  h-full pl-4 ">
        <h1 className="">Enter data to send</h1>
        <input
          type="text"
          onChange={(event) => {
            setmsgToSend(event.target.value);
          }}
          className=" border-2 border-black "
        />
        <button
          onClick={() => {
            conn?.send(msgToSend);
          }}
          className=" p-2 border-2 border-black "
        >
          Send
        </button>
        <div className=" flex flex-row pt-2">
          <h1>Data recived from server : </h1>
          <p className=" border-2 border-black px-3">{socketData}</p>
        </div>
        <div className=" flex items-center gap-2 ">
          <div className=" gap-2 flex ">
            <button
              onClick={newGame}
              className="border-2 border-black p-2 text-xl"
            >
              Create game
            </button>
            <button
              onClick={joinGame}
              className="border-2 border-black p-2 text-xl"
            >
              Join game
            </button>
            <input
              type="text"
              onChange={(event) => {
                setmsgToSend(event.target.value);
              }}
              className="p-2  border-2 border-black "
            />
            <span>Game code : {msgToSend}</span>
          </div>
        </div>
      </div>
      {player2}
      <div className=" flex border-2 border-black h-full text-2xl ">
        <span className="">Chose color</span>
        <label>
          <input
            type="radio"
            value="white"
            checked={playerColor === "white"}
            onChange={selectPlayerColor}
          />
          white
        </label>
        <label>
          <input
            type="radio"
            value="black"
            checked={playerColor === "black"}
            onChange={selectPlayerColor}
          />
          black
        </label>
      </div>
    </div>
  );
};

export default WebSocketComponent;
