import json
import redis
from typing import Optional, Union
from pydantic import ValidationError
import logging
from app.game_state.models import (
    GameState, 
    CompletedGameState, 
    GameStatus
)

class GameStateParser:
    """
    Retrieves and parses game states from Redis storage.
    """
    def __init__(
        self, 
        redis_host: str = "localhost", 
        redis_port: int = 6379, 
        redis_password: str = "", 
        redis_db: int = 0
    ):
        """
        Initialize Redis connection.
        
        Args:
            redis_host: Redis server hostname
            redis_port: Redis server port
            redis_password: Redis authentication password
            redis_db: Redis database number
        """
        self.redis = redis.Redis(
            host=redis_host,
            port=redis_port,
            password=redis_password,
            db=redis_db,
            decode_responses=True
        )
        self.logger = logging.getLogger(__name__)
    
    def get_game_state(
        self, 
        game_id: str
    ) -> Optional[Union[GameState, CompletedGameState]]:
        """
        Retrieve game state from Redis.
        
        Args:
            game_id: Unique identifier for the game
        
        Returns:
            Game state or None if not found
        """
        try:
            game_data = self.redis.get(game_id)
            
            if not game_data:
                self.logger.warning(f"Game not found: {game_id}")
                return None
                
            data = json.loads(game_data)
            
            # Determine game state type
            if data.get("status") == GameStatus.COMPLETED and "outcome" in data:
                return CompletedGameState.parse_obj(data)
            else:
                return GameState.parse_obj(data)
                
        except json.JSONDecodeError:
            self.logger.error(f"Failed to decode JSON for game {game_id}")
            return None
        except ValidationError as e:
            self.logger.error(f"Validation error for game {game_id}: {str(e)}")
            return None
        except Exception as e:
            self.logger.error(f"Error getting game state: {str(e)}")
            return None
    
    def get_board_fen(self, game_id: str) -> str:
        """
        Retrieve board FEN for a given game.
        
        Args:
            game_id: Unique identifier for the game
        
        Returns:
            FEN string, defaults to starting position if game not found
        """
        game_state = self.get_game_state(game_id)
        if not game_state:
            return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        return game_state.fen