package main

import (
	"go-chess/db"
	"go-chess/internals/user"
	"go-chess/internals/websocket"
	"go-chess/routes"
	"log"
)

func main() {

	dbConn, err := db.NewDataBase()

	if err != nil {
		log.Fatalf("could not initialize database connection: %s", err)
	}

	userRepo := user.NewRepository(dbConn.GetDB())
	userService := user.NewService(userRepo)
	userHander := user.NewHandler(userService)
	// dev code starts

	gameService := websocket.NewGameService()
	wsHandler := websocket.NewHandler(gameService)
	// listen for all incoming register rutine
	go gameService.Run()

	// dev code ends
	routes.InitRouter(userHander, wsHandler)
	routes.Start("0.0.0.0:8080")
}
