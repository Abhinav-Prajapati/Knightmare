package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/notnil/chess"
)

// GameService defines the methods that a game service must implement.
type GameService interface {
	NewGame(gameId string) *chess.Game
	GetGameById(gameId string) (*chessGameService, bool)
	// Add more methods as needed
}

type gameService struct {
	games map[string]*chessGameService
}

type chessGameService struct {
	gameId   string
	game     *chess.Game
	client_1 *websocket.Conn
	client_2 *websocket.Conn
}

func (gs *gameService) NewGame(gameId string) *chess.Game {
	fmt.Println("room id : " + gameId)
	newGameService := chessGameService{game: chess.NewGame(), gameId: gameId}
	gs.games[gameId] = &newGameService
	return newGameService.game
}

func (gs *gameService) GetGameById(game_id string) (*chessGameService, bool) {
	game, ok := gs.games[game_id]
	if !ok {
		return nil, false
	}
	return game, true
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all connections
	},
}

func main() {
	// gamePool := make(map[string]*chessGameService)
	var gs GameService = &gameService{games: make(map[string]*chessGameService)}

	// clients := make(map[string]gameClient) // should we make gameclient a pointer ?

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

	router.GET("/newgame/:gameid", func(c *gin.Context) {
		gameId := c.Param("gameid")
		game := gs.NewGame(gameId)
		fmt.Println(game)
		c.JSON(http.StatusOK, gin.H{"status": "game created"})
	})

	router.GET("/:player/:gameuuid", func(c *gin.Context) {
		game_uuid := c.Param("gameuuid")
		player := c.Param("player")
		handleConnections(c.Writer, c.Request, gs, game_uuid, player)
	})

	// Start the server on localhost port 8080
	err := router.Run(":8080")
	if err != nil {
		log.Fatal("Error starting server: ", err)
	}
}

func sendGameState(ws *websocket.Conn, game *chessGameService) {
	// Get the current FEN representation of the game
	fen := game.game.Position().String()
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

func handleConnections(w http.ResponseWriter, r *http.Request, gs GameService, game_uuid string, player string) {
	// Upgrade from http to a WebSocket
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}

	defer ws.Close()

	game, ok := gs.GetGameById(game_uuid)
	if player == "player1" {
		game.client_1 = ws
	}
	if player == "player2" {
		game.client_2 = ws
	}

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

		err = game.game.MoveStr(string(msg)) // directly moves in game

		if err != nil {
			sendErrorMessage(ws, "Invalid move")
		} else {
			sendGameState(game.client_1, game)
			sendGameState(game.client_2, game) // send game state to both clients
		}
	}
}
