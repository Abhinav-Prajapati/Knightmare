import chess
import chess.engine
import logging
from typing import Optional, Tuple, Dict, Any
import os
from app.game_state import ChessEngineResponse

logger = logging.getLogger(__name__)

class ChessEngine:
    def __init__(self, stockfish_path: Optional[str] = None, time_limit: float = 1.0):
        """
        Initialize the chess engine.

        Args:
            stockfish_path (Optional[str]): Path to Stockfish executable.
            time_limit (float): Time limit for move calculation in seconds.
        """
        self.time_limit = time_limit
        self.stockfish_path = stockfish_path or os.getenv("STOCKFISH_PATH")
        self.engine = None
        self.logger = logging.getLogger(__name__)

        self._initialize_engine()

    def _initialize_engine(self):
        """Attempts to initialize the Stockfish engine."""
        if not self.stockfish_path:
            self.logger.error("❌ STOCKFISH_PATH environment variable is not set.")
            return

        try:
            self.engine = chess.engine.SimpleEngine.popen_uci(self.stockfish_path)
            self.logger.info(f"✅ Stockfish initialized. Binary found at {self.stockfish_path}")
        except (FileNotFoundError, chess.engine.EngineTerminatedError) as e:
            self.logger.error(f"❌ Failed to start Stockfish at {self.stockfish_path}: {str(e)}")
            self.engine = None

        if not self.engine:
            self.logger.warning("⚠️ Stockfish not found, using fallback move generation.")

    
    def __del__(self):
        """Clean up engine on deletion."""
        if self.engine:
            try:
                self.engine.quit()
            except:
                pass
    
    def get_best_move(self, board_fen: str, depth: int = 10, move_time: int = 1000) -> Dict[str, Any]:
        """
        Get the best move for the current position.
        Args:
            board_fen: FEN string representation of the board
            depth: Search depth (if using Stockfish)
            move_time: Time in milliseconds to search (if using Stockfish)
        Returns:
            Dictionary with move details:
            - moveUci: UCI notation (e.g., "e2e4")
            - moveSan: SAN notation (e.g., "e4")
            - fenAfter: FEN after move
            - isGameOver: Whether the game is over after the move
            - isCheck: Whether the move puts opponent in check
            - isCheckmate: Whether the move checkmates opponent
        """
        try:
            board = chess.Board(board_fen)
            
            # If game already over, return None
            if board.is_game_over():
                return self._create_empty_response()
                
            # Try to use Stockfish if available
            if self.engine:
                # Convert move_time from milliseconds to seconds
                time_limit = chess.engine.Limit(time=move_time/1000, depth=depth)
                result = self.engine.play(board, time_limit)
                best_move = result.move
            else:
                # Fallback for when Stockfish is not available
                legal_moves = list(board.legal_moves)
                if not legal_moves:
                    return self._create_empty_response()
                    
                # Simple evaluation - prioritize captures and checks
                best_score = -1000
                best_move = legal_moves[0]
                
                for move in legal_moves:
                    score = 0
                    # Prioritize captures
                    if board.is_capture(move):
                        captured_piece = board.piece_at(move.to_square)
                        if captured_piece:
                            # Approximate piece values
                            piece_values = {
                                chess.PAWN: 1, 
                                chess.KNIGHT: 3, 
                                chess.BISHOP: 3,
                                chess.ROOK: 5, 
                                chess.QUEEN: 9
                            }
                            score += piece_values.get(captured_piece.piece_type, 0)
                    
                    # Check if move gives check
                    board.push(move)
                    if board.is_check():
                        score += 1
                    if board.is_checkmate():
                        score += 100
                    board.pop()
                    
                    if score > best_score:
                        best_score = score
                        best_move = move
            
            # Apply the move to a copy of the board
            board_after = board.copy()
            san_move = board.san(best_move)
            board_after.push(best_move)
            
            # Check if the move puts opponent in check or checkmate
            is_check = board_after.is_check()
            is_checkmate = board_after.is_checkmate()
            is_game_over = board_after.is_game_over()
            
            return ChessEngineResponse(
                moveUci=best_move.uci(),
                moveSan=san_move,
                fenAfter=board_after.fen(),
                isGameOver=is_game_over,
                isCheck=is_check,
                isCheckmate=is_checkmate
            )
            
        except Exception as e:
            self.logger.error(f"Error calculating best move: {str(e)}")
            return self._create_empty_response()
    
    def _create_empty_response(self) -> Dict[str, Any]:
        """Create an empty response for cases where no move is available."""
        return {
            "moveUci": "",
            "moveSan": "",
            "fenAfter": "",
            "isGameOver": True,
            "isCheck": False,
            "isCheckmate": False
        }
    
    def is_game_over(self, board_fen: str) -> Tuple[bool, Optional[str]]:
        """
        Check if the game is over.
        Args:
            board_fen: FEN string representation of the board
        Returns:
            Tuple of (is_over, result_description)
        """
        try:
            board = chess.Board(board_fen)
            
            if board.is_checkmate():
                return True, "checkmate"
            elif board.is_stalemate():
                return True, "stalemate"
            elif board.is_insufficient_material():
                return True, "insufficient material"
            elif board.is_seventyfive_moves():
                return True, "fifty-move rule"
            elif board.is_fivefold_repetition() or board.is_repetition(3):
                return True, "repetition"
            elif board.is_game_over():
                return True, "game over"
                
            return False, None
            
        except Exception as e:
            self.logger.error(f"Error checking game status: {str(e)}")
            return False, None