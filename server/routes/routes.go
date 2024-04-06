package routes

import (
	"go-chess/internals/user"
	"go-chess/internals/websocket"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

var router *gin.Engine

func InitRouter(userHander *user.Handler, wsHandler *websocket.Handler) {
	router = gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 3600,
	}))

	// Routes for User handling
	router.GET("/ping", userHander.Ping) // move ping func to move resinable place
	router.POST("/signup", userHander.CreateUser)
	router.POST("/signin", userHander.Login)

	// Routes for websockets connection handling
	router.GET("/create-game", wsHandler.CreateGame)
	router.GET("/join-game", wsHandler.JoinGame)

	router.GET("/get-games", wsHandler.GetGames)
	router.GET("/get-players", wsHandler.GetPlayers)

}

func Start(addr string) error {
	return router.Run(addr)
}
