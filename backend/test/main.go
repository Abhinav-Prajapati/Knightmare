package main

import (
	"fmt"

	"github.com/notnil/chess"
)

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

func main() {
	game := chess.NewGame()
	// generate moves until game is over
	// for game.Outcome() == chess.NoOutcome {
	// 	// select a random move
	// 	moves := game.ValidMoves()
	// 	move := moves[rand.Intn(len(moves))]
	// 	fmt.Println("move : ", move.String())
	// 	game.Move(move)
	// }
	move, err := MoveFromLongNotation(game, "h2h4")
	game.Move(move)
	turn := game.Position().Turn().Name()
	fmt.Println("next to move is ", turn)
	if err != nil {
		fmt.Println("error ", err.Error())
	}
	// print outcome and game PGN
	fmt.Println(game.Position().Board().Draw())
	fmt.Printf("Game completed. %s by %s.\n", game.Outcome(), game.Method())
	fmt.Println(game.String())
	/*
		Output:

		 A B C D E F G H
		8- - - - - - - -
		7- - - - - - ♚ -
		6- - - - ♗ - - -
		5- - - - - - - -
		4- - - - - - - -
		3♔ - - - - - - -
		2- - - - - - - -
		1- - - - - - - -

		Game completed. 1/2-1/2 by InsufficientMaterial.

		1.Nc3 b6 2.a4 e6 3.d4 Bb7 ...
	*/
}
