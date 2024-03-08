package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all connections
	},
}

func main() {

	// Configure WebSocket route
	http.HandleFunc("/ws", handleConnections)

	// Start the server on localhost port 8080
	log.Println("Server started on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	// Upgrade initial GET request to a WebSocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer ws.Close()

	for {
		// Read in a new message
		messageType, msg, err := ws.ReadMessage()
		if err != nil {
			log.Printf("error: %v", err)
			break
		}
		fmt.Println("Message received from client:", string(msg))

		// Echo the message back to the client
		err = ws.WriteMessage(messageType, msg)
		if err != nil {
			log.Printf("error writing message to socket connection: %v", err)
			break
		}
	}
}
