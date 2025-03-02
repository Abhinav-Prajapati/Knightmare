from fastapi import FastAPI, HTTPException
import chess
import chess.engine
import os
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Chess Engine API")
# Path to the Stockfish engine - update this to match your environment
STOCKFISH_PATH = "./stockfish-17-x86-64-avx2"

class ChessMoveRequest(BaseModel):
    fen: str
    difficulty: Optional[int] = 10  # 1-20 scale (maps to Elo ratings internally)
    timeLimit: Optional[float] = 0.1  # seconds
    depthLimit: Optional[int] = None

class ChessMoveResponse(BaseModel):
    move: Optional[str] = None  # UCI format (e.g. "e2e4"), None if game is over
    fenAfter: str
    isGame_over: bool
    isCheck: bool
    isCheckmate: bool

@app.post("/get_best_move", response_model=ChessMoveResponse)
async def get_best_move(request: ChessMoveRequest):
    # Check if the Stockfish engine exists
    if not os.path.exists(STOCKFISH_PATH):
        raise HTTPException(status_code=500, detail="Chess engine not found at the specified path")
    
    try:
        # Create a board from the FEN string
        board = chess.Board(request.fen)
        
        # Check if the game is already over
        if board.is_game_over():
            return ChessMoveResponse(
                move=None,
                fen_after=board.fen(),
                is_game_over=True,
                is_check=board.is_check(),
                is_checkmate=board.is_checkmate()
            )
        
        # Start the engine
        engine = chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH)
        
        try:
            # Set engine skill level based on difficulty
            if request.difficulty is not None:
                # Ensure difficulty is within bounds
                difficulty = max(1, min(20, request.difficulty))
                # Map difficulty to an Elo rating (roughly)
                # Skill 0 ~= 1100 Elo, Skill 20 ~= 3000 Elo
                target_elo = 1100 + (difficulty - 1) * (1900 / 19)
                
                # Configure engine options
                engine.configure({"Skill Level": difficulty - 1})  # 0-19 in Stockfish
                
                # Some versions of Stockfish support UCI_Elo which directly sets Elo
                try:
                    engine.configure({"UCI_Elo": int(target_elo)})
                    engine.configure({"UCI_LimitStrength": True})
                except Exception:
                    # If UCI_Elo is not supported, we'll stick with just Skill Level
                    pass
            
            # Calculate the best move
            limit = chess.engine.Limit(
                time=request.time_limit,
                depth=request.depth_limit
            )
            
            result = engine.play(board, limit)
            best_move = result.move
            
            # Make the move on the board to get the new FEN
            board.push(best_move)
            
            # Return the response
            return ChessMoveResponse(
                move=best_move.uci(),
                fen_after=board.fen(),
                is_game_over=board.is_game_over(),
                is_check=board.is_check(),
                is_checkmate=board.is_checkmate()
            )
        finally:
            # Always close the engine, even if an error occurs
            engine.quit()
            
    except chess.engine.EngineTerminatedError:
        raise HTTPException(status_code=500, detail="Chess engine terminated unexpectedly")
    except chess.engine.EngineError as e:
        raise HTTPException(status_code=500, detail=f"Chess engine error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Chess Engine API is running. Use /get_best_move endpoint to get chess moves."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)