from enum import Enum
from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field

class GameStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ABORTED = "ABORTED"

class GameOutcome(str, Enum):
    WHITE_WIN = "WHITE_WIN"
    BLACK_WIN = "BLACK_WIN"
    DRAW = "DRAW"
    ABORTED = "ABORTED"

class WinMethod(str, Enum):
    CHECKMATE = "CHECKMATE"
    RESIGNATION = "RESIGNATION"
    TIMEOUT = "TIMEOUT"
    STALEMATE = "STALEMATE"
    INSUFFICIENT_MATERIAL = "INSUFFICIENT_MATERIAL"
    THREEFOLD_REPETITION = "THREEFOLD_REPETITION"
    FIFTY_MOVE_RULE = "FIFTY_MOVE_RULE"
    AGREEMENT = "AGREEMENT"

class MoveHistoryItem(BaseModel):
    uci: str
    san: str
    fen: str
    timestamp: int

class GameOverStatus(BaseModel):
    isGameOver: bool
    isInCheck: bool
    isInCheckmate: bool
    isInStalemate: bool
    isInDraw: bool

class GameState(BaseModel):
    gameId: str
    fen: str
    pgn: Optional[str] = None
    turn: Literal["w", "b"]
    moveHistory: List[MoveHistoryItem] = []
    whitePlayerId: Optional[str] = None
    blackPlayerId: Optional[str] = None
    status: GameStatus
    gameOverStatus: Optional[GameOverStatus] = None
    legalMoves: Optional[List[str]] = None

class CompletedGameState(GameState):
    outcome: GameOutcome
    winMethod: WinMethod
    endTime: datetime
    finalFen: str

class ChessEngineRequest(BaseModel):
    fen: str
    depth: Optional[int] = 3
    moveTime: Optional[int] = 1000  # in milliseconds

class ChessEngineResponse(BaseModel):
    moveSan: str
    moveUci: str
    fenAfter: str
    isGameOver: bool
    isCheck: bool
    isCheckmate: bool

class ChessMoveRequest(BaseModel):
    gameId: str
    playerId: str
    UCImove: str