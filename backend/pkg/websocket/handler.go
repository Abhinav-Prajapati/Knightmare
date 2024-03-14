// pkg/websocket/handler.go
package websocket

import (
	"fmt"
	"go-chess/pkg/game"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func HandleConnections(w http.ResponseWriter, r *http.Request, gs game.GameService, gameUUID string, player string) {
	fmt.Println("A client joined")
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}

	defer ws.Close()

	chessGame, ok := gs.GetGameByID(gameUUID)
	if !ok {
		sendErrorMessage(ws, "Game not found")
		return
	}

	if player == "player1" {
		chessGame.Client1 = ws
	}
	if player == "player2" {
		sendJoinMessage(chessGame.Client1)
		chessGame.Client2 = ws
	}

	for {
		_, msg, err := ws.ReadMessage()
		if err != nil {
			log.Printf("error: %v", err)
			break
		}
		fmt.Println("Message received from client: ", string(msg))

		move, err := game.MoveFromLongNotation(chessGame.Game, string(msg))

		// Find whose turn it is
		currentTurn := chessGame.Game.Position().Turn().Name()
		if ws == chessGame.Client1 && currentTurn == string(chessGame.Client1Color) {
			chessGame.Game.Move(move)
		} else if ws == chessGame.Client2 && currentTurn == string(chessGame.Client2Color) {
			chessGame.Game.Move(move)
		} else {
			fmt.Println("recived invlid move from client")
		}

		if err != nil {
			fmt.Println("error while parsing incoming move from socket ", err.Error())
			sendErrorMessage(ws, "Invalid move")
		} else {
			sendGameFEN(chessGame.Client1, chessGame)
			sendGameFEN(chessGame.Client2, chessGame)
		}
	}
}

func sendJoinMessage(ws *websocket.Conn) {
	message := game.Message{
		Type:    "join",
		Content: "A player has joined the game.",
	}
	sendMessage(ws, message)
}

func sendLeaveMessage(ws *websocket.Conn) {
	message := game.Message{
		Type:    "leave",
		Content: "A player has left the game.",
	}
	sendMessage(ws, message)
}

func sendGameFEN(ws *websocket.Conn, chessGame *game.ChessGame) {
	message := game.Message{
		Type:    "FEN",
		Content: chessGame.Game.FEN(),
	}
	sendMessage(ws, message)
}

func sendMessage(ws *websocket.Conn, message game.Message) {
	err := ws.WriteJSON(message)
	if err != nil {
		log.Printf("error sending message: %v", err)
	}
}

func sendErrorMessage(ws *websocket.Conn, message string) {
	err := ws.WriteMessage(websocket.TextMessage, []byte(message))
	if err != nil {
		log.Printf("error writing message to socket connection: %v", err)
	}
}
