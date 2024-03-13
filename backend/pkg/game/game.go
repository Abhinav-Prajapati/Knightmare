// pkg/game/game.go
package game

import (
	"fmt"

	"github.com/gorilla/websocket"
	"github.com/notnil/chess"
)

type Message struct {
	Type    string
	Content string
}

type ChessGame struct {
	GameID  string
	Game    *chess.Game
	Client1 *websocket.Conn
	Client2 *websocket.Conn
}

func (gs *GameService) NewGame(gameID string) *chess.Game {
	fmt.Println("room id : " + gameID)
	newGame := ChessGame{Game: chess.NewGame(), GameID: gameID}
	gs.Games[gameID] = &newGame
	return newGame.Game
}

type GameService struct {
	Games map[string]*ChessGame
}

func (gs *GameService) GetGameByID(gameID string) (*ChessGame, bool) {
	game, ok := gs.Games[gameID]
	if !ok {
		return nil, false
	}
	return game, true
}
