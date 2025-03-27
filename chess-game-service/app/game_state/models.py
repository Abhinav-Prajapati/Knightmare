from enum import Enum
from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field

class GameStatus(str, Enum):
    """Represents possible states of a chess game."""
    WAITING = "WAITING"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ABORTED = "ABORTED"
    TIMEOUT = "TIMEOUT"

class GameOutcome(str, Enum):
    """Defines possible game outcomes."""
    WHITE_WIN = "WHITE_WIN"
    BLACK_WIN = "BLACK_WIN"
    DRAW = "DRAW"
    ABORTED = "ABORTED"

class WinMethod(str, Enum):
    """Describes methods for winning or ending a game."""
    CHECKMATE = "CHECKMATE"
    RESIGNATION = "RESIGNATION"
    TIMEOUT = "TIMEOUT"
    STALEMATE = "STALEMATE"
    INSUFFICIENT_MATERIAL = "INSUFFICIENT_MATERIAL"
    THREEFOLD_REPETITION = "THREEFOLD_REPETITION"
    FIFTY_MOVE_RULE = "FIFTY_MOVE_RULE"
    AGREEMENT = "AGREEMENT"

class GameOverStatus(BaseModel):
    """Represents the current state of a game's conclusion."""
    isGameOver: bool
    isInCheck: bool
    isInCheckmate: bool
    isInStalemate: bool
    isInDraw: bool

class GameState(BaseModel):
    """Represents the current state of a chess game."""
    gameId: str
    fen: str
    pgn: str
    turn: Literal["w", "b"]
    whitePlayerId: Optional[str] = None
    blackPlayerId: Optional[str] = None
    status: GameStatus
    gameOverStatus: Optional[GameOverStatus] = None

class CompletedGameState(GameState):
    """Represents a finished chess game with final details."""
    outcome: GameOutcome
    winMethod: WinMethod
    endTime: datetime
    finalFen: str

class ChessEngineRequest(BaseModel):
    """Request model for chess engine operations."""
    gameId: str
    depth: Optional[int] = Field(default=3, ge=1, le=20)
    moveTime: Optional[int] = Field(default=1000, ge=100, le=10000)

class ChessEngineResponse(BaseModel):
    """Response model for chess engine move generation."""
    moveSan: str
    moveUci: str
    fenAfter: str
    isGameOver: bool
    isCheck: bool
    isCheckmate: bool

class ChessMoveRequest(BaseModel):
    """Request model for making a chess move."""
    gameId: str
    playerId: str
    UCImove: str

class CreateComputerGameRequest(BaseModel):
    """Request model for creating a new computer game."""
    playerId: str 
    engineId: str 
    playAs: Literal['w','b']
    level: Optional[str] = Field(default="medium")