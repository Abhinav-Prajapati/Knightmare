from fastapi import FastAPI, HTTPException
import os
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware

from chess import STARTING_FEN
import chess

from app.game_state.updater import GameStateUpdater
from app.game_state.parser import GameStateParser
from app.game_state.models import (
    ChessEngineRequest, 
    GameState, 
    ChessMoveRequest, 
    ChessEngineResponse, 
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

def get_best_computer_move(request: ChessMoveRequest) -> GameState:
    """
    Process player's move and generate computer's response.
    
    Args:
        request: Details of the player's move
    
    Returns:
        Updated game state after computer's move
    
    Raises:
        HTTPException: If game state retrieval or move processing fails
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

    # Get computer's best move
    engine_move = engine.get_best_move(
        board_fen=new_game_state.fen,
        depth=10,
        move_time=100
    )

    # Update game state with computer's move
    computer_game_state = updater.update_game_state(
        game_id=request.gameId,
        move_uci=engine_move.moveUci,
        player_id='chess_engine'
    )

    if not computer_game_state:
        raise HTTPException(status_code=500, detail="Error processing computer move")

    return computer_game_state

@app.post("/engine/move", response_model=GameState)
def process_move(request: ChessMoveRequest) -> GameState:
    """
    Handle a player's move and return updated game state.
    
    Args:
        request: Player's move details
    
    Returns:
        Updated game state after processing move
    """
    return get_best_computer_move(request)

@app.post("/engine/new-game", response_model=GameState)
def create_new_game(req: CreateComputerGameRequest) -> GameState:
    """
    Create a new chess game.
    
    Args:
        req: Game creation request with player and color details
    
    Returns:
        Initial game state
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