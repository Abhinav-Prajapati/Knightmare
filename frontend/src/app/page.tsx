"use client";
import React, { useEffect, useState } from "react";

const WebSocketComponent: React.FC = () => {
  const [msgToSend, setmsgToSend] = useState("");
  const [socketData, setSocketData] = useState<string>("");
  const [conn, setConn] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080/ws"); // Replace with your WebSocket server URL
    setConn(socket);

    socket.onopen = () => {
      console.log("WebSocket connected");
      socket.send("1");
    };

    socket.onmessage = (event) => {
      setSocketData(event.data);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <div>
      <div className=" flex flex-row gap-2  ">
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
      </div>
      <div className=" flex flex-row pt-2">
        <h1>Data recived from server : </h1>
        <p className=" border-2 border-black px-3">{socketData}</p>
      </div>
    </div>
  );
};

export default WebSocketComponent;
