'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Navbar from '@/components/Navbar';
import ChessBoard from '@/components/ChessBoard';
import Chat from '@/components/Chat';
import GameButtons from '@/components/GameButtons';
import MoveHistory from '@/components/MoveHistory';
import { useAuthStore } from '@/store/auth';
import { useGameStore } from '@/store/game';
import GameOverPopup from '@/components/GameOverPopup';

interface PageProps {
  params: {
    gameId: string;
  };
}

interface GameOverStatus {
  is_gameover: boolean;
  is_in_check: boolean;
  is_in_checkmate: boolean;
  is_in_stalemate: boolean;
  is_in_draw: boolean;
}

interface GameState {
  fen: string;
  move_history: any[];
  playerColor: 'white' | 'black';
  white_player_id: string | null;
  black_player_id: string | null;
  game_over_status: GameOverStatus | null;
  turn: 'white' | 'black';
}

const GameRoom: React.FC<PageProps> = ({ params: { gameId } }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",

    move_history: [],
    playerColor: 'white',
    white_player_id: null,
    black_player_id: null,
    game_over_status: null,
    turn: 'white'
  });
  const [gameStarted, setGameStarted] = useState(false);
  const [side, setSide] = useState<'black' | 'white' | null>(null);

  const { token, user, isAuthenticated } = useAuthStore();
  const { setCurrentGameId } = useGameStore();

  const [highlightSquares, setHighlightSquares] = useState({})

  const updateHighlightSquares = (from: string, to: string) => {
    setHighlightSquares({
      [from]: { backgroundColor: "rgba(0, 255, 0, 0.5)" }, // Light green
      [to]: { backgroundColor: "rgba(0, 255, 0, 0.5)" }
    });
  };


  // use this to set custom color to squares ie move peoces or piaces in attack or under check 
  useEffect(() => {
    if (gameState.move_history.length > 0) {
      const lastMove = gameState.move_history[gameState.move_history.length - 1];

      if (lastMove.from && lastMove.to) {
        updateHighlightSquares(lastMove.from, lastMove.to);
      }
    } else {
      setHighlightSquares({});
    }
    if (gameState.game_over_status?.is_gameover) {
      setShowPopup(true);
    }
    console.log(gameState)
  }, [gameState.move_history, gameState.game_over_status?.is_gameover]);

  useEffect(() => {
    setCurrentGameId(gameId);
  }, [gameId]);

  // Initialize WebSocket connection after game starts
  useEffect(() => {
    if (!gameStarted) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_BASE_URL!, {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      newSocket.emit('join_room', gameId);
    });

    newSocket.on('game_state', ({ gameState: newGameState }) => {
      setGameState(newGameState);

      if (user?.id) {
        if (newGameState.white_player_id === user.id) {
          setSide('white');
        } else if (newGameState.black_player_id === user.id) {
          setSide('black');
        } else {
          setSide(null);
        }
      }
    });

    newSocket.on('error', ({ message }) => {
      console.error('Socket error:', message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [gameStarted, gameId, user?.id]);

  const makeMove = (from: string, to: string, promotion?: string) => {
    if (!socket || !user?.id) return false;

    socket.emit('send_move', {
      playerId: user.id,
      roomId: gameId,
      move_from: from,
      move_to: to,
      promotion: null,
    });

    return true;
  };

  const startGame = async () => {
    if (!isAuthenticated || !token) {
      alert("You must be logged in to start the game.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/game/${gameId}/join`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setGameStarted(true);
      }

      alert(data.message);
    } catch (error) {
      console.error("Error joining game:", error);
      alert("Failed to join the game.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex justify-between px-4 items-center">
        {/* Left Section: Dev Log Display */}
        <div className="w-[25vw] bg-[#36454F4d] mb-12 rounded-2xl p-4">
          <p className="text-sm text-gray-600 px-4 py-2">
            Game status and events will be displayed here.
          </p>
          <p className="text-sm text-gray-600 px-4 py-2">
            Game id: {gameId}
          </p>
        </div>

        {/* Chess Board */}
        <div className="flex h-max">
          <ChessBoard
            gameFen={gameState.fen}
            playerColor={side || 'white'}
            handlePieceDrop={makeMove}
            highlightedSquares={highlightSquares}
          />
        </div>

        {/* Right Section */}
        {gameStarted ? (
          <div className="w-1/4 flex flex-col gap-4 h-[calc(100vh-theme(spacing.24))]">
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              <div className="h-[50%] overflow-auto rounded-lg ">
                <MoveHistory moves={gameState.move_history} />
              </div>
              <div className="h-[50%] overflow-auto rounded-lg ">
                <Chat />
              </div>
            </div>
            <div className="mt-auto">
              <GameButtons />
            </div>
          </div>
        ) : (
          // TODO: make new component for aceppt challenge
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-lg font-semibold mb-4">
              You've been challenged!
            </p>
            <button
              className="bg-green-500 text-white px-6 py-3 rounded-lg"
              onClick={startGame}
            >
              Accept Challenge
            </button>
          </div>
        )}
      </div>
      <GameOverPopup
        gameOverMethod={''}
        winner="White"
        showPopup={showPopup}
        setShowPopup={setShowPopup}
      />
    </>
  );
};

export default GameRoom;
