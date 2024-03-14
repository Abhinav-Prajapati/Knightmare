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

type ClientColor string

const (
	White ClientColor = "White"
	Black ClientColor = "Black"
)

type ChessGame struct {
	GameID       string
	Game         *chess.Game
	Client1      *websocket.Conn
	Client2      *websocket.Conn
	Client1Color ClientColor
	Client2Color ClientColor
}

// todo set client color based on color selected from front end (player 1 is to white for testing only)
func (gs *GameService) NewGame(gameID string) *chess.Game {
	fmt.Println("room id : " + gameID)
	newGame := ChessGame{Game: chess.NewGame(), GameID: gameID, Client1Color: White, Client2Color: Black}
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

func MoveFromLongNotation(game *chess.Game, s string) (*chess.Move, error) {
	moves := game.ValidMoves()
	for _, move := range moves {
		fmt.Println("valid moves ", move)
		if s == move.String() {
			return move, nil
		}
	}
	// todo handle promotion
	return nil, fmt.Errorf("invalid long move { or promotion/casting because casting/promotion is not handled }")
}
