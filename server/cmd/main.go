package main

import (
	"go-chess/db"
	"go-chess/internals/user"
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

	routes.InitRouter(userHander)
	routes.Start("0.0.0.0:8080")
}
