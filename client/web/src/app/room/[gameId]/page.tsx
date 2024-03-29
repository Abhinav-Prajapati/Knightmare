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

  const [conn, setConn] = useState<WebSocket | null>(null);
  const [gameFen, setGameFen] = useState()
  const [playerColor, setPlayerColor] = useState<string>('white')
  const [gameID, setGameId] = useState<string>(gameId)
  const [socketData, setSocketData] = useState<string>("recived data form websocket");

  const handlePieceDrop = (from: string, to: string) => {
    conn?.send(`${from}${to}`);
    console.log("from: ", from, "to: ", to)
    setGameFen(gameFen);
    return true;
  };

  useEffect(() => {
    const joinGame = async () => {
      setGameId(gameId)
      let response = await axios.get(
        `http://localhost:8080/joingame/${gameID}`
      );
      console.log(response);
      setPlayerColor(response.data["color"]);
      const socket = new WebSocket(
        `ws://localhost:8080/player2/${gameID}`
      );
      setConn(socket)
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
    }
    joinGame()
  }, [])


  return (
    <>
      <Navbar />
      <div className=" flex ">
        <ChessBoard
          gameFen={gameFen}
          playerColor={playerColor}
          handlePieceDrop={handlePieceDrop}
        />
        <div className=" flex flex-col w-[25%]">
          <MoveHistory />
          <div className="text-white">{gameId}</div>
        </div>
      </div>
    </>
  )
}

export default page
