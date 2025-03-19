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
    difficulty: Optional[int] = 10 

class ChessMoveResponse(BaseModel):
    moveUci: Optional[str] = None  # UCI format (e.g., "e2e4"), None if game is over
    moveSan: Optional[str] = None  # SAN format (e.g., "e4"), None if game is over
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
                move_uci=None,
                move_san=None,
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
                targetElo = max(1320, 1100 + (difficulty - 1) * (1900 / 19))
                # Some versions of Stockfish support UCI_Elo for setting Elo directly
                engine.configure({"UCI_Elo": int(targetElo)})
                engine.configure({"UCI_LimitStrength": True})
            
            # Calculate the best move
            time_limit = max(0.2, (targetElo - 700) / 2300 * 5)
            limit = chess.engine.Limit(
                time=time_limit 
            )

            # Print engine parameters
            print(f"Engine Settings → Difficulty: {difficulty}, Elo: {int(targetElo)}, Time: {time_limit:.2f}s")
            
            result = engine.play(board, limit)
            bestMove = result.move
            
            # Get SAN notation before making the move
            bestMoveSan = board.san(bestMove)
            
            # Make the move on the board to get the new FEN
            board.push(bestMove)
            
            # Return the response
            return ChessMoveResponse(
                moveUci=bestMove.uci(),
                moveSan=bestMoveSan,
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
