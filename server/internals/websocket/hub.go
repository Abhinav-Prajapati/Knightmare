package websocket

import (
	"fmt"
)

// todo: move to client go

//

type Game struct {
	ID      string             `json:"id"`
	Name    string             `json:"name"`
	Clients map[string]*Client `json:"clients"`
}

type Games struct {
	Games    map[string]*Game
	Register chan *Client
}

func NewGameService() *Games {
	return &Games{
		Games:    make(map[string]*Game),
		Register: make(chan *Client),
	}
}

func (gs *Games) Run() {
	for {
		client := <-gs.Register
		// check if requested game is there or not
		_, ok := gs.Games[client.gameId]
		if ok {
			// get the game from gameService(games)
			game := gs.Games[client.gameId]
			game.Clients[client.clientId] = client
			fmt.Println("new client registred ", client.clientId)
		}
	}
}
