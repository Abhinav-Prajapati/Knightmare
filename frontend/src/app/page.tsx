"use client";
import { useEffect } from "react";

const IndexPage = () => {
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080/ws");

    // Connection opened
    socket.addEventListener("open", function (event) {
      console.log("Connected to WebSocket server");

      // Send a ping message
      const pingMessage = { content: "Hello, World!" };
      socket.send(JSON.stringify(pingMessage));
    });

    // Listen for messages
    socket.addEventListener("message", function (event) {
      console.log("Message from server:", event.data);
    });

    // Clean up on unmount
    return () => {
      socket.close();
    };
  }, []);

  return (
    <div>
      <h1>WebSocket Example</h1>
      <p>Check console for messages</p>
    </div>
  );
};

export default IndexPage;
