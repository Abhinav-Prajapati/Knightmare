import asyncio
import logging
import chess
import argparse
import uuid
from datetime import datetime
from typing import Optional, Union
DEFAULT_PGN = '[Event "Game"]\n[Site "Your Chess App"]\n[Date "????.??.??"]\n[Round "?"]\n[White "?"]\n[Black "?"]\n[Result "*"]\n\n*'
from app.game_state.models import (
    GameState, GameStatus, GameOverStatus,CompletedGameState 
)

from app.game_state.updater import GameStateUpdater
from app.game_state.parser import GameStateParser
from app.chess_engine.engine import ChessEngine

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ChessSelfPlay:
    def __init__(
        self,
        game_id: Optional[str] = None,
        redis_host: str = "localhost",
        redis_port: int = 6379,
        redis_password: str = "",
        redis_db: int = 0,
        stockfish_path: Optional[str] = None,
        white_depth: int = 10,
        black_depth: int = 5,
        move_time: int = 1000
    ):
        """
        Initialize a self-play chess game with different engine strengths.
        
        Args:
            game_id: Optional game ID (generated if not provided)
            redis_host: Redis host
            redis_port: Redis port
            redis_password: Redis password
            redis_db: Redis database number
            stockfish_path: Path to Stockfish executable
            white_depth: Search depth for White (higher = stronger)
            black_depth: Search depth for Black (higher = stronger)
            move_time: Time for engine to calculate moves in milliseconds
        """
        self.game_id = game_id or f"game_{uuid.uuid4()}"
        self.redis_params = {
            "redis_host": redis_host,
            "redis_port": redis_port,
            "redis_password": redis_password,
            "redis_db": redis_db
        }
        
        # Initialize components
        self.updater = GameStateUpdater(**self.redis_params)
        self.parser = GameStateParser(**self.redis_params)
        self.engine = ChessEngine(stockfish_path=stockfish_path)
        
        # Engine parameters
        self.white_depth = white_depth
        self.black_depth = black_depth
        self.move_time = move_time
        
        logger.info(f"Self-play game initialized with ID: {self.game_id}")
        logger.info(f"White depth: {white_depth}, Black depth: {black_depth}")

    async def create_new_game(self) -> GameState:
        """Create a new game and save it to Redis."""
        initial_board = chess.Board()
        # Create initial game state
        game_state = GameState(
            gameId=self.game_id,
            fen=initial_board.fen(),
            turn="w",
            whitePlayerId="engine_white",
            blackPlayerId="engine_black",
            status=GameStatus.IN_PROGRESS,
            gameOverStatus=GameOverStatus(
                isGameOver=False,
                isInCheck=False,
                isInCheckmate=False,
                isInStalemate=False,
                isInDraw=False
            ),
            pgn=DEFAULT_PGN
        )
        
        # Save initial state
        success = await self.updater.save_game_state(game_state)
        if not success:
            logger.error("Failed to create new game")
            raise Exception("Failed to create new game")
            
        logger.info(f"New game created with ID: {self.game_id}")
        return game_state

    async def make_engine_move(self, is_white: bool) -> Optional[GameState]:
        """
        Make an engine move based on the current player's color.
        
        Args:
            is_white: True if White is moving, False if Black is moving
        
        Returns:
            Updated GameState or None if move failed
        """
        # Get current FEN
        current_fen = self.parser.get_board_fen(self.game_id)
        player_id = "engine_white" if is_white else "engine_black"
        depth = self.white_depth if is_white else self.black_depth
        
        # Check if game is already over
        board = chess.Board(current_fen)
        if board.is_game_over():
            logger.info("Game is already over, no engine move needed")
            return None
            
        # Calculate best move with the appropriate depth
        engine_result = self.engine.get_best_move(
            current_fen,
            depth=depth,
            move_time=self.move_time
        )
        
        if not engine_result["moveUci"]:
            logger.error(f"Engine couldn't find a move for {'White' if is_white else 'Black'}")
            return None
            
        # Update game state with engine move
        updated_state = await self.updater.update_game_state(
            self.game_id, engine_result["moveUci"], player_id
        )
        
        if not updated_state:
            logger.error(f"Failed to make {'White' if is_white else 'Black'} move: {engine_result['moveUci']}")
            return None
            
        side = "White" if is_white else "Black"
        logger.info(f"{side} engine move (depth {depth}): {engine_result['moveUci']} ({engine_result['moveSan']})")
        return updated_state

    def is_game_over(self) -> bool:
        """Check if the game is over."""
        game_state = self.parser.get_game_state(self.game_id)
        if not game_state:
            return False
            
        return game_state.gameOverStatus and game_state.gameOverStatus.isGameOver

    async def play_game(self, max_moves: int = 100):
        """
        Play a complete self-play game.
        
        Args:
            max_moves: Maximum number of moves to play before forcing a draw
        """
        # Create a new game
        await self.create_new_game()
        move_count = 0
        
        # Game loop
        while move_count < max_moves:
            # Get current state
            game_state = self.parser.get_game_state(self.game_id)
            if not game_state:
                logger.error("Failed to get game state")
                break
                
            # Determine current player
            is_white = game_state.turn == "w"
            
            # Make move
            updated_state = await self.make_engine_move(is_white)
            if not updated_state:
                break
                
            # Print board status
            self.print_board_status()
            
            # Check if game is over
            if self.is_game_over():
                break
                
            move_count += 1
            
        # Check final game status
        final_state = self.parser.get_game_state(self.game_id)
        if final_state:
            self.print_game_result(final_state)

    def print_board_status(self):
        """Print current board status."""
        game_state = self.parser.get_game_state(self.game_id)
        if not game_state:
            return
            
        board = chess.Board(game_state.fen)
        print("\nCurrent board:")
        print(board)
        
        # Show move information if available
        if game_state.pgn:
            print(game_state.pgn)
        
        if game_state.gameOverStatus:
            if game_state.gameOverStatus.isInCheck:
                print("Check!")
            if game_state.gameOverStatus.isInCheckmate:
                print("Checkmate!")
            if game_state.gameOverStatus.isInStalemate:
                print("Stalemate!")
            if game_state.gameOverStatus.isInDraw:
                print("Draw!")

    def print_game_result(self, final_state : Union[GameState, CompletedGameState]):
        """Print the final game result."""
        if not final_state.gameOverStatus.isGameOver:
            return
            
        print("\n=== GAME OVER ===")
        
        if final_state.gameOverStatus.isInCheckmate:
            winner = "White (depth 10)" if final_state.turn == "b" else "Black (depth 5)"
            print(f"{winner} wins by checkmate!")
        elif final_state.gameOverStatus.isInStalemate:
            print("Game drawn by stalemate")
        elif final_state.gameOverStatus.isInDraw:
            board = chess.Board(final_state.fen)
            if board.is_insufficient_material():
                print("Game drawn due to insufficient material")
            elif board.is_seventyfive_moves():
                print("Game drawn by fifty-move rule")
            elif board.is_repetition(3):
                print("Game drawn by threefold repetition")
            else:
                print("Game drawn")
        
        # Print move history
        if final_state.pgn:
            print("\nGame Pgn:")
            print(final_state.pgn)

async def main():
    parser = argparse.ArgumentParser(description="Chess engine self-play with different depths")
    parser.add_argument("--game-id", type=str, help="Game ID (optional)")
    parser.add_argument("--redis-host", type=str, default="localhost", help="Redis host")
    parser.add_argument("--redis-port", type=int, default=6379, help="Redis port")
    parser.add_argument("--redis-password", type=str, default="", help="Redis password")
    parser.add_argument("--redis-db", type=int, default=0, help="Redis DB number")
    parser.add_argument("--stockfish-path", type=str, help="Path to Stockfish executable")
    parser.add_argument("--white-depth", type=int, default=10, help="Search depth for White")
    parser.add_argument("--black-depth", type=int, default=5, help="Search depth for Black")
    parser.add_argument("--move-time", type=int, default=1000, help="Engine move time (ms)")
    parser.add_argument("--max-moves", type=int, default=100, help="Maximum moves")
    
    args = parser.parse_args()
    
    # Create game
    game = ChessSelfPlay(
        game_id=args.game_id,
        redis_host=args.redis_host,
        redis_port=args.redis_port,
        redis_password=args.redis_password,
        redis_db=args.redis_db,
        stockfish_path=args.stockfish_path,
        white_depth=args.white_depth,
        black_depth=args.black_depth,
        move_time=args.move_time
    )
    
    # Play the self-play game
    await game.play_game(max_moves=args.max_moves)


if __name__ == "__main__":
    asyncio.run(main())