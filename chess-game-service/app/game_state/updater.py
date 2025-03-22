import json
import chess
import chess.pgn
import redis
import logging
from io import StringIO
from datetime import datetime
from typing import Optional, Dict, Any, Tuple, Union
from .models import (
    GameState, CompletedGameState, GameStatus, GameOutcome, 
    WinMethod, GameOverStatus
)

logger = logging.getLogger(__name__)


class GameStateUpdater:
    def __init__(self, redis_host: str = "localhost", redis_port: int = 6379, 
                 redis_password: str = "", redis_db: int = 0):
        """Initialize Redis connection."""
        self.redis = redis.Redis(
            host=redis_host,
            port=redis_port,
            password=redis_password,
            db=redis_db,
            decode_responses=True
        )
        self.logger = logging.getLogger(__name__)
    
    async def save_game_state(self, game_state: Union[GameState, CompletedGameState]) -> bool:
        """
        Save game state to Redis.
        Args:
            game_state: GameState or CompletedGameState object
        Returns:
            True if successful, False otherwise
        """
        try:
            game_id = game_state.gameId
            
            # Convert to JSON and save
            json_data = game_state.json()
            success = self.redis.set(game_id, json_data)
            
            if success:
                self.logger.info(f"Game state saved for game {game_id}")
                return True
            else:
                self.logger.error(f"Failed to save game state for game {game_id}")
                return False
                
        except Exception as e:
            self.logger.error(f"Error saving game state: {str(e)}")
            return False
    
    async def update_game_state(self, game_id: str, move_uci: str, player_id: str) -> Optional[GameState]:
        """
        Update game state in Redis after a move.
        Args:
            game_id: ID of the game
            move_uci: Move in UCI notation (e.g., "e2e4")
            player_id: ID of the player making the move
        Returns:
            Updated GameState or None if failed
        """
        # Get current state
        try:
            game_data = self.redis.get(game_id)
            
            if not game_data:
                self.logger.error(f"Game not found: {game_id}")
                return None
                
            # Parse current game state
            data = json.loads(game_data)
            game_state:GameState = GameState.parse_obj(data)
            
            # Create chess board from FEN
            board = chess.Board(game_state.fen)
            
            # Validate player's turn
            is_white_move = board.turn == chess.WHITE
            is_correct_player = (is_white_move and player_id == game_state.whitePlayerId) or \
                               (not is_white_move and player_id == game_state.blackPlayerId)
                               
            if not is_correct_player:
                self.logger.warning(f"Not player {player_id}'s turn")
                return None
            
            # Try to make the move
            try:
                move = chess.Move.from_uci(move_uci)
                if move not in board.legal_moves:
                    self.logger.warning(f"Illegal move: {move_uci}")
                    return None
                    
                board.push(move)

                if game_state.pgn is None or game_state.pgn == "":
                    game_pgn = chess.pgn.Game()
                    game_pgn.headers["Event"] = "Game"
                    node = game_pgn.add_variation(move)
                else:
                    game_pgn = chess.pgn.read_game(StringIO(game_state.pgn))
                    
                    if game_pgn is None:
                        # add whites move in pgn 
                        game_pgn = chess.pgn.Game()
                        node = game_pgn.add_variation(move)
                    else:
                        # add blacks move in pgn 
                        current_node = game_pgn
                        while current_node.variations:
                            current_node = current_node.variations[0]
                        node = current_node.add_variation(move)

                game_state.pgn = str(game_pgn)

                game_over_status = GameOverStatus(
                    isGameOver=board.is_game_over(),
                    isInCheck=board.is_check(),
                    isInCheckmate=board.is_checkmate(),
                    isInStalemate=board.is_stalemate(),
                    isInDraw=board.is_game_over() and not board.is_checkmate()
                )
                
                # Update game state
                game_state.fen = board.fen()
                game_state.turn = "w" if board.turn == chess.WHITE else "b"
                game_state.gameOverStatus = game_over_status
                
                # Save updated state
                await self.save_game_state(game_state)
                
                # Handle game over if needed
                if board.is_game_over():
                    await self.handle_game_over(game_id, board, game_state)
                
                return game_state
                
            except ValueError as e:
                self.logger.error(f"Invalid move format: {move_uci}, error: {str(e)}")
                return None
                
        except Exception as e:
            self.logger.error(f"Error updating game state: {str(e)}")
            return None
    
    async def handle_game_over(self, game_id: str, board: chess.Board, game_state: GameState) -> None:
        """
        Handle game over situation.
        Args:
            game_id: ID of the game
            board: Chess board object
            game_state: Current game state
        """
        try:
            outcome = None
            win_method = None
            
            # Determine outcome and win method
            if board.is_checkmate():
                outcome = GameOutcome.BLACK_WIN if board.turn == chess.WHITE else GameOutcome.WHITE_WIN
                win_method = WinMethod.CHECKMATE
            elif board.is_stalemate():
                outcome = GameOutcome.DRAW
                win_method = WinMethod.STALEMATE
            elif board.is_insufficient_material():
                outcome = GameOutcome.DRAW
                win_method = WinMethod.INSUFFICIENT_MATERIAL
            elif board.is_seventyfive_moves():
                outcome = GameOutcome.DRAW
                win_method = WinMethod.FIFTY_MOVE_RULE
            elif board.is_fivefold_repetition() or board.is_repetition(3):
                outcome = GameOutcome.DRAW
                win_method = WinMethod.THREEFOLD_REPETITION
            else:
                outcome = GameOutcome.DRAW
                win_method = WinMethod.FIFTY_MOVE_RULE
            
            # Create completed game state
            completed_game = CompletedGameState(
                **game_state.dict(),
                outcome=outcome,
                winMethod=win_method,
                endTime=datetime.now(),
                finalFen=board.fen(),
                status=GameStatus.COMPLETED
            )
            
            # Save to Redis
            await self.save_game_state(completed_game)
            
            self.logger.info(f"Game {game_id} completed with outcome: {outcome}, method: {win_method}")
            
            # Note: The NestJS service would handle removing from Redis,
            # but we'll keep it there for now so it can be queried
            
        except Exception as e:
            self.logger.error(f"Error handling game over: {str(e)}")