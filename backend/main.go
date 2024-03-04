package main

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var clients = make(map[*websocket.Conn]bool) // Connected clients
var broadcast = make(chan Message)           // Broadcast channel

// Message struct
type Message struct {
	Content string `json:"content"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all connections
	},
}

func main() {
	// Configure WebSocket route
	http.HandleFunc("/ws", handleConnections)

	// Start listening for incoming chat messages
	go handleMessages()

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

	// Register new client
	clients[ws] = true

	// Send a welcome message
	welcomeMsg := Message{Content: "Hello, World!"}
	if err := ws.WriteJSON(welcomeMsg); err != nil {
		log.Printf("error: %v", err)
		ws.Close()
		delete(clients, ws)
		return
	}

	for {
		var msg Message
		// Read in a new message as JSON and map it to a Message object
		err := ws.ReadJSON(&msg)
		if err != nil {
			log.Printf("error: %v", err)
			delete(clients, ws)
			break
		}
		// Send the newly received message to the broadcast channel
		broadcast <- msg
	}
}

func handleMessages() {
	for {
		// Grab the next message from the broadcast channel
		msg := <-broadcast
		// Send it out to every client that is currently connected
		for client := range clients {
			err := client.WriteJSON(msg)
			if err != nil {
				log.Printf("error: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
	}
}

// // golang channles
// func printNumber(ch chan int) {
// 	for i := 1; i <= 10; i++ {
// 		ch <- i
// 		time.Sleep(time.Millisecond * 100)
// 	}
// 	close(ch)
// }
// func main() {
// 	myChannel := make(chan int)
// 	go printNumber(myChannel)
// 	for num := range myChannel {
// 		fmt.Println("number recived from go channel ", num)
// 	}
// 	fmt.Println("Done Reciving ")
// }
