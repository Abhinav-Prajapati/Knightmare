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

func MoveFromLongNotation(game *chess.Game, s string) (*chess.Move, error) {
	moves := game.ValidMoves()
	// fmt.Println("move recived in func : ", s)
	// fmt.Println("valid moves ")

	for _, move := range moves {
		fmt.Println("valid moves ", move)
		if s == move.String() {
			// fmt.Println("move found ", move.String())
			return move, nil
			// err := game.Move(move)
		}
	}
	// todo handle promotion
	return nil, fmt.Errorf("invalid long move { or promotion/casting because casting/promotion is not handled }")
}
