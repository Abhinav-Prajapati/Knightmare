package routes

import (
	"go-chess/internals/user"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

var router *gin.Engine

func InitRouter(userHander *user.Handler) {
	router = gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * 3600,
	}))
	router.GET("/ping", userHander.Ping) // move ping func to move resinable place
	router.GET("/create-user", userHander.CreateUser)

}

func Start(addr string) error {
	return router.Run(addr)
}
