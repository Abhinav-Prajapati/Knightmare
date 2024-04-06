package websocket

import (
	"fmt"
	"math/rand"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type Handler struct {
	games *Games
}

// / recives the games map creeted in hub.go
func NewHandler(gs *Games) *Handler {
	return &Handler{
		games: gs,
	}
}

func (h *Handler) CreateGame(c *gin.Context) {
	//TODO: generate a url frendly uuid
	randomNumber := rand.Intn(1001) + 1000
	gameId := strconv.Itoa(randomNumber)
	h.games.Games[gameId] = &Game{
		ID:      gameId,
		Clients: make(map[string]*Client),
	}
	c.JSON(http.StatusOK, gin.H{"gameid": gameId})
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (h *Handler) JoinGame(c *gin.Context) {

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	gameId := c.Query("game-id")
	userId := c.Query("user-id")

	fmt.Printf("Join Request : gameid -> %s userid -> %s", gameId, userId)

	// construct a client struct to send over register channel
	client := &Client{
		conn:     conn,
		gameId:   gameId,
		clientId: userId,
	}

	h.games.Register <- client
	client.readMessage()

}

type GamesRes struct {
	ID string `json:"id"`
}

func (h *Handler) GetGames(c *gin.Context) {
	rooms := make([]GamesRes, 0)
	for _, r := range h.games.Games {
		rooms = append(rooms, GamesRes{
			ID: r.ID,
		})
	}
	c.JSON(http.StatusOK, rooms)
}

type PlayersRes struct {
	ID string `json:"id"`
}

func (h *Handler) GetPlayers(c *gin.Context) {
	gameId := c.Query("game-id")
	playersInRoom := make([]PlayersRes, 0)

	// get game form game id
	game := h.games.Games[gameId]
	players := game.Clients
	for _, player := range players {
		playersInRoom = append(playersInRoom, PlayersRes{
			ID: player.clientId,
		})
	}
	c.JSON(http.StatusOK, playersInRoom)
}
