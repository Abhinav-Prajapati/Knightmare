// main.go
package main

import (
	"fmt"
	"go-chess/pkg/game"
	"go-chess/pkg/websocket"
	"log"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	var gs game.GameService = game.GameService{Games: make(map[string]*game.ChessGame)}

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 3600,
	}))

	router.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "Hello, quick chess!")
	})

	router.POST("/newgame/:gameid", func(c *gin.Context) {
		// Parse JSON data from request body
		var requestData map[string]interface{}
		if err := c.BindJSON(&requestData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON data"})
			return
		}
		playerColor := requestData["side"].(string) // type assertion is used to try to convert interface to string it might throw err
		fmt.Println("player color ", playerColor)
		gameID := c.Param("gameid")
		game := gs.NewGame(gameID, playerColor)
		fmt.Println(game.Position().Board().Draw())
		c.JSON(http.StatusOK, gin.H{"status": "game created"})
	})

	router.GET("/joingame/:gameid", func(c *gin.Context) {

		gameID := c.Param("gameid")
		game, _ := gs.GetGameByID(gameID) // TODO handle err when game is not found
		playerColor := game.Client2Color
		fmt.Println("player 2 joined with assigned color ", playerColor)
		c.JSON(http.StatusOK, gin.H{"status": "game joined", "side": playerColor})
	})

	router.GET("/:player/:gameuuid", func(c *gin.Context) {
		gameUUID := c.Param("gameuuid")
		player := c.Param("player")
		websocket.HandleConnections(c.Writer, c.Request, gs, gameUUID, player)
	})

	err := router.Run("0.0.0.0:8080")
	if err != nil {
		log.Fatal("Error starting server: ", err)
	}
}
