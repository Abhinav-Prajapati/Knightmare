import requests
import socketio
import time
from typing import Dict, Any

class ChessGameTest:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.sio = socketio.Client()
        self.game_state = None
        self.current_user = None
        
        # Setup socket.io event handlers
        self.sio.on('game_state', self.on_game_state)
        self.sio.on('events', self.on_events)
        self.sio.on('error', self.on_error)
        
    def on_game_state(self, data: Dict[str, Any]):
        print(f"\n[{self.current_user}] Received game state: {data}")
        self.game_state = data
        
    def on_events(self, data: str):
        print(f"\n[{self.current_user}] Received event: {data}")
        
    def on_error(self, data: Dict[str, str]):
        print(f"\n[{self.current_user}] Error: {data['message']}")

    def read_token_from_file(self, user: str) -> str:
        """Reads the token from the user token file"""
        self.current_user = user
        token_file = f'tokens/{user}.token.txt'
        try:
            with open(token_file, 'r') as f:
                return f.read().strip()
        except FileNotFoundError:
            raise Exception(f"Token file not found for user {user}. Please make sure the user is signed in.")
    
    def create_game(self, creator_user: str) -> str:
        """Creates a new game and returns the game ID"""
        token = self.read_token_from_file(creator_user)
        
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.post(f"{self.base_url}/game/create_game", headers=headers)
        response.raise_for_status()
        game_id = response.json()['game_id']
        print(f"\n[{self.current_user}] Created game with ID: {game_id}")
        return game_id

    def join_game(self, game_id: str, joining_user: str) -> None:
        """Joins an existing game"""
        token = self.read_token_from_file(joining_user)
        
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.post(f"{self.base_url}/game/{game_id}/join", headers=headers)
        response.raise_for_status()
        print(f"\n[{self.current_user}] Joined game: {game_id}")
        
    def connect_socket(self):
        """Connects to the WebSocket server"""
        self.sio.connect(self.base_url)
        print(f"\n[{self.current_user}] Connected to WebSocket server")
        
    def join_room(self, game_id: str):
        """Joins a game room"""
        self.sio.emit('join_room', game_id)
        print(f"\n[{self.current_user}] Joined room: {game_id}")
        
    def make_move(self, game_id: str, move_from: str, move_to: str, promotion: str = None):
        """Makes a chess move"""
        move_data = {
            'roomId': game_id,
            'move_from': move_from,
            'move_to': move_to,
            'promotion': promotion
        }
        self.sio.emit('send_move', move_data)
        print(f"\n[{self.current_user}] Made move: {move_from} -> {move_to}")
        # Wait for the game state update
        time.sleep(1)

    def is_my_turn(self) -> bool:
        """Checks if it's the current player's turn"""
        if not self.game_state:
            return False
        
        turn_color = self.game_state['gameState']['turn']
        # Determine if we're white or black based on being player1 or player2
        is_white = self.current_user == self.game_state['gameState']['player1']
        return (turn_color == 'w' and is_white) or (turn_color == 'b' and not is_white)

    def wait_for_turn(self, timeout: int = 30):
        """Waits for player's turn, with timeout in seconds"""
        start_time = time.time()
        while not self.is_my_turn():
            if time.time() - start_time > timeout:
                raise TimeoutError(f"Waited too long for {self.current_user}'s turn")
            time.sleep(1)
            
    def play_two_player_game(self, user1: str, user2: str):
        """Simulates a two-player game"""
        try:
            # User 1 creates the game
            game_id = self.create_game(user1)
            self.connect_socket()
            self.join_room(game_id)
            
            # User 2 joins the game
            self.join_game(game_id, user2)
            
            # Wait for connection to establish
            time.sleep(2)
            
            # Example game sequence
            moves = [
                (user1, 'e2', 'e4'),  # White's first move
                (user2, 'e7', 'e5'),  # Black's first move
                (user1, 'g1', 'f3'),  # White's second move
                (user2, 'b8', 'c6'),  # Black's second move
            ]
            
            for player, from_square, to_square in moves:
                # Switch to the correct player
                self.current_user = player
                
                # Wait for our turn
                print(f"\n[{player}] Waiting for turn...")
                self.wait_for_turn()
                
                # Make the move
                self.make_move(game_id, from_square, to_square)
                
                # Wait for move to be processed
                time.sleep(1)
            
            # Display final position
            if self.game_state:
                print("\nFinal game state:")
                print(f"FEN: {self.game_state['gameState']['fen']}")
                print(f"Move history: {self.game_state['gameState']['move_history']}")
            
        except Exception as e:
            print(f"Error during test: {e}")
        finally:
            if self.sio.connected:
                self.sio.disconnect()
                print(f"\n[{self.current_user}] Disconnected from WebSocket server")

def run_multiplayer_test():
    """Runs a complete multiplayer test scenario"""
    test = ChessGameTest()
    print("\nStarting two-player game test...")
    test.play_two_player_game('test_user_1', 'test_user_2')

if __name__ == "__main__":
    run_multiplayer_test()
