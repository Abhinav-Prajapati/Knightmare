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

	router.GET("/newgame/:gameid", func(c *gin.Context) {
		gameID := c.Param("gameid")
		game := gs.NewGame(gameID)
		fmt.Println(game)
		c.JSON(http.StatusOK, gin.H{"status": "game created"})
	})

	router.GET("/:player/:gameuuid", func(c *gin.Context) {
		gameUUID := c.Param("gameuuid")
		player := c.Param("player")
		websocket.HandleConnections(c.Writer, c.Request, gs, gameUUID, player)
	})

	err := router.Run(":8080")
	if err != nil {
		log.Fatal("Error starting server: ", err)
	}
}
