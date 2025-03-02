from fastapi import FastAPI, HTTPException
import chess
import chess.engine
import os
from pydantic import BaseModel
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Chess Engine API")
origins = [
    "http://localhost:3000",  # React/Next.js frontend
    "http://127.0.0.1:3000",
    "*"  # Allow all origins (not recommended for production)
]

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Domains allowed to access the API
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)
# Path to the Stockfish engine - update this to match your environment
stockfishPath = "./stockfish-17-x86-64-avx2"

class ChessMoveRequest(BaseModel):
    fen: str
    difficulty: Optional[int] = 10  # 1-20 scale (maps to Elo ratings internally)
    timeLimit: Optional[float] = 0.1  # seconds
    depthLimit: Optional[int] = None

class ChessMoveResponse(BaseModel):
    move: Optional[str] = None  # UCI format (e.g., "e2e4"), None if game is over
    fenAfter: str
    isGameOver: bool
    isCheck: bool
    isCheckmate: bool

@app.post("/engine/best-move", response_model=ChessMoveResponse)
async def getBestMove(request: ChessMoveRequest):
    # Check if the Stockfish engine exists
    if not os.path.exists(stockfishPath):
        raise HTTPException(status_code=500, detail="Chess engine not found at the specified path")
    
    try:
        # Create a board from the FEN string
        board = chess.Board(request.fen)
        
        # Check if the game is already over
        if board.is_game_over():
            return ChessMoveResponse(
                move=None,
                fenAfter=board.fen(),
                isGameOver=True,
                isCheck=board.is_check(),
                isCheckmate=board.is_checkmate()
            )
        
        # Start the engine
        engine = chess.engine.SimpleEngine.popen_uci(stockfishPath)
        
        try:
            # Set engine skill level based on difficulty
            if request.difficulty is not None:
                difficulty = max(1, min(20, request.difficulty))  # Ensure difficulty is within bounds
                targetElo = 1100 + (difficulty - 1) * (1900 / 19)  # Approximate Elo rating
                
                # Configure engine options
                engine.configure({"Skill Level": difficulty - 1})  # Stockfish expects 0-19

                # Some versions of Stockfish support UCI_Elo for setting Elo directly
                try:
                    engine.configure({"UCI_Elo": int(targetElo)})
                    engine.configure({"UCI_LimitStrength": True})
                except Exception:
                    pass  # Ignore if not supported
            
            # Calculate the best move
            limit = chess.engine.Limit(
                time=request.timeLimit,
                depth=request.depthLimit
            )
            
            result = engine.play(board, limit)
            bestMove = result.move
            
            # Make the move on the board to get the new FEN
            board.push(bestMove)
            
            # Return the response
            return ChessMoveResponse(
                move=bestMove.uci(),
                fenAfter=board.fen(),
                isGameOver=board.is_game_over(),
                isCheck=board.is_check(),
                isCheckmate=board.is_checkmate()
            )
        finally:
            engine.quit()  # Always close the engine, even if an error occurs
            
    except chess.engine.EngineTerminatedError:
        raise HTTPException(status_code=500, detail="Chess engine terminated unexpectedly")
    except chess.engine.EngineError as e:
        raise HTTPException(status_code=500, detail=f"Chess engine error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Chess Engine API is running. Use /engine/best-move endpoint to get chess moves."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)