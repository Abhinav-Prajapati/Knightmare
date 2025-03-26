from fastapi import FastAPI, HTTPException
import os
from typing import Any, Optional
from fastapi.middleware.cors import CORSMiddleware

from chess import STARTING_FEN

from app.game_state.updater import GameStateUpdater
from app.game_state.parser import GameStateParser
from app.game_state.models import (
    ChessEngineRequest,
    GameState, 
    ChessMoveRequest, 
    GameStatus, 
    CreateComputerGameRequest
)
from app.chess_engine.engine import ChessEngine

app = FastAPI(title="Chess Engine API")

# Configurable CORS origins
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

# Initialize services
updater = GameStateUpdater()
parser = GameStateParser()
engine = ChessEngine()

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

def make_player_move(request: ChessMoveRequest) -> Optional[GameState]:
    """
    Process and save the player's move to the game state.
    """
    # Retrieve current game state
    game_state = parser.get_game_state(request.gameId)
    if not game_state:
        raise HTTPException(status_code=404, detail=f"Game with ID {request.gameId} not found.")

    # Update game state with player's move
    new_game_state = updater.update_game_state(
        game_id=request.gameId,
        move_uci=request.UCImove,
        player_id=request.playerId
    )

    if not new_game_state:
        raise HTTPException(status_code=400, detail="Invalid move")

    return new_game_state

@app.post("/engine/move/player", response_model=GameState)
def process_player_move(request: ChessMoveRequest) -> GameState:
    """
    Handle a player's move and return updated game state.
    """
    return make_player_move(request)

@app.post("/engine/move/computer", response_model=GameState)
def process_computer_move(req:ChessEngineRequest) -> GameState:
    """
    Handle computer's move generation based on game state.
    """
    # Validate game state first
    game_state = parser.get_game_state(req.gameId)
    if not game_state:
        raise HTTPException(status_code=404, detail=f"Game with ID {req.gameId} not found.")

    # Generate computer move based on current board state
    engine_move = engine.get_best_move(
        board_fen=game_state.fen,
        depth=10,
        move_time=100
    )

    # Update game state with computer's move
    computer_game_state = updater.update_game_state(
        game_id=req.gameId,
        move_uci=engine_move.moveUci,
        player_id='chess_engine'
    )

    if not computer_game_state:
        raise HTTPException(status_code=500, detail="Error processing computer move")

    return computer_game_state

@app.post("/engine/new-game", response_model=GameState)
def create_new_game(req: CreateComputerGameRequest) -> GameState:
    """
    Create a new chess game.
    """
    # Generate unique game ID
    game_id = f"abc"
     
    # Determine player colors
    white_player_id = req.playerId if req.playAs == 'w' else req.engineId
    black_player_id = req.engineId if req.playAs == 'w' else req.playerId

    # Create initial game state
    initial_game_state = GameState(
        gameId=game_id,
        fen=STARTING_FEN,
        pgn="",
        turn="w",
        whitePlayerId=white_player_id,
        blackPlayerId=black_player_id,
        status=GameStatus.IN_PROGRESS,
        gameOverStatus=None,
        legalMoves=None
    )

    # Save game state
    updater.save_game_state(initial_game_state)

    return initial_game_state

@app.get("/")
def root() -> dict:
    return {"message": "Chess Engine API is running."}

def main() -> None:
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()