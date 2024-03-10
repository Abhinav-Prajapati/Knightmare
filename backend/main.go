package main

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strconv"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/notnil/chess"
)

type GameService interface {
	NewGame() *chess.Game
	GetGameById(id string) (*chess.Game, bool)
}

type gameService struct {
	games map[string]*chess.Game
}

func (gs *gameService) NewGame() (*chess.Game, string) {
	game := chess.NewGame()
	id := strconv.Itoa(rand.Intn(10000)) // todo : use uuids
	gs.games[id] = game
	return game, id
}

func (gs *gameService) GetGameById(game_id string) (*chess.Game, bool) {
	game, ok := gs.games[game_id]
	return game, ok
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all connections
	},
}

func main() {

	games := make(map[string]*chess.Game)
	gameService := &gameService{games: games}

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"}, // Allow all origins
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 3600, // Maximum age of a preflight request
	}))

	router.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "Hello, quick chess!")
	})
	router.GET("/newgame", func(c *gin.Context) {
		_, uuid := gameService.NewGame()
		c.JSON(http.StatusOK, gin.H{"game_uuid": uuid})

	})
	router.GET("/game/:gameuuid", func(c *gin.Context) {
		game_uuid := c.Param("gameuuid")
		handleConnections(c.Writer, c.Request, gameService, game_uuid)
	})
	// Start the server on localhost port 8080
	err := router.Run(":8080")
	if err != nil {
		log.Fatal("Error starting server: ", err)
	}
}

func sendGameState(ws *websocket.Conn, game *chess.Game) {
	// Get the current FEN representation of the game
	fen := game.Position().String()
	fmt.Println("Game : ", fen)
	// Send the FEN representation to the client
	err := ws.WriteMessage(websocket.TextMessage, []byte(fen))
	if err != nil {
		log.Printf("error writing message to socket connection: %v", err)
	}
}

func sendErrorMessage(ws *websocket.Conn, message string) {
	// Send the error message to the client
	err := ws.WriteMessage(websocket.TextMessage, []byte(message))
	if err != nil {
		log.Printf("error writing message to socket connection: %v", err)
	}
}

func handleConnections(w http.ResponseWriter, r *http.Request, gs *gameService, game_uuid string) {
	// Upgrade from http to a WebSocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer ws.Close()

	game, ok := gs.GetGameById(game_uuid)
	if !ok {
		sendErrorMessage(ws, "Game not found")
		return
	}

	for {
		_, msg, err := ws.ReadMessage()

		if err != nil {
			log.Printf("error: %v", err)
			break
		}
		fmt.Println("Message received from client: ", string(msg))

		err = game.MoveStr(string(msg)) // directly moves in game
		if err != nil {
			sendErrorMessage(ws, "Invalid move")
		} else {
			sendGameState(ws, game)
		}
	}
}
