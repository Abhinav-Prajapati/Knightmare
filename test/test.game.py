import requests
import socketio
import time
from typing import Dict, Any

class ChessGameTest:
    def __init__(self, base_url: str = "http://localhost:3000"):
        self.base_url = base_url
        self.sio = socketio.Client()
        self.game_state = None
        self.user = 'test_user_1'
        self.user_file = f'tokens/{self.user}.token.txt'
        
        # Setup socket.io event handlers
        self.sio.on('game_state', self.on_game_state)
        self.sio.on('events', self.on_events)
        self.sio.on('error', self.on_error)
        
    def on_game_state(self, data: Dict[str, Any]):
        print(f"\nReceived game state: {data}")
        self.game_state = data
        
    def on_events(self, data: str):
        print(f"\nReceived event: {data}")
        
    def on_error(self, data: Dict[str, str]):
        print(f"\nError: {data['message']}")

    def read_token_from_file(self) -> str:
        """Reads the token from the user token file"""
        try:
            with open(self.user_file, 'r') as token_file:
                token = token_file.read().strip()
                return token
        except FileNotFoundError:
            raise Exception("Token file not found. Please make sure the user is signed in.")
    
        
    def create_game(self) -> str:
        """Creates a new game and returns the game ID"""
        token = self.read_token_from_file()
        
        headers = {
            'Authorization': f'Bearer {token}' 
        }
        response = requests.post(f"{self.base_url}/game/create_game",headers=headers)
        response.raise_for_status()
        game_id = response.json()['game_id']
        print(f"\nCreated game with ID: {game_id}")
        return game_id
        
    def connect_socket(self):
        """Connects to the WebSocket server"""
        self.sio.connect(self.base_url)
        print("\nConnected to WebSocket server")
        
    def join_room(self, game_id: str):
        """Joins a game room"""
        self.sio.emit('join_room', game_id)
        print(f"\nJoined room: {game_id}")

    def join_game_(self, game_id: str, joining_user: str) -> None:
        """Joins an existing game"""
        token = self.read_token_from_file(joining_user)
        
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.post(f"{self.base_url}/game/{game_id}/join", headers=headers)
        response.raise_for_status()
        print(f"\n[{self.current_user}] Joined game: {game_id}")

        
    def make_move(self, game_id: str, move_from: str, move_to: str, promotion: str = None):
        """Makes a chess move"""
        move_data = {
            'roomId': game_id,
            'move_from': move_from,
            'move_to': move_to,
            'promotion': promotion
        }
        self.sio.emit('send_move', move_data)
        print(f"\nMade move: {move_from} -> {move_to}")
        # Wait a bit for the game state update
        time.sleep(1)
        
    def play_fools_mate(self):
        """Executes the fool's mate sequence"""
        try:
            # Create new game
            game_id = self.create_game()
            
            # Connect and join room
            self.connect_socket()
            self.join_room(game_id)
            
            # Wait for connection to establish
            time.sleep(1)
            
            # Fool's mate sequence
            # 1. f3
            self.make_move(game_id, 'f2', 'f3')
            # 1... e6
            self.make_move(game_id, 'e7', 'e6')
            # 2. g4
            self.make_move(game_id, 'g2', 'g4')
            # 2... Qh4#
            self.make_move(game_id, 'd8', 'h4')
            
            # Wait for final game state
            time.sleep(1)
            
            # Display final position
            if self.game_state:
                print("\nFinal game state:")
                print(f"FEN: {self.game_state['gameState']['fen']}")
                print(f"Game over status: {self.game_state['gameState']['game_over_status']}")
                print(f"Move history: {self.game_state['gameState']['move_history']}")
            
        except Exception as e:
            print(f"Error during test: {e}")
        finally:
            if self.sio.connected:
                self.sio.disconnect()
                print("\nDisconnected from WebSocket server")

if __name__ == "__main__":
    # Create and run the test
    test = ChessGameTest()
    test.play_fools_mate()
