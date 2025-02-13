'use client'

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Navbar from '@/components/Navbar';
import ChessBoard from '@/components/ChessBoard';
import Chat from '@/components/Chat';
import GameButtons from '@/components/GameButtons';
import MoveHistory from '@/components/MoveHistory';
import { useAuthStore } from '@/store/auth';
import { useGameStore } from '@/store/game';

interface PageProps {
  params: {
    gameId: string;
  };
}

const GameRoom: React.FC<PageProps> = ({ params: { gameId } }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState({
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: [],
    playerColor: 'white',
    isGameOver: false
  });

  const { token, user, isAuthenticated } = useAuthStore();
  const { isInGame, currentGameId, setCurrentGameId } = useGameStore();

  useEffect(() => {
    setCurrentGameId(gameId);

    const newSocket = io(process.env.NEXT_PUBLIC_API_BASE_URL!, {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    setSocket(newSocket);
    newSocket.emit('join_room', gameId);

    newSocket.on('game_state', ({ gameState: newGameState }) => {
      setGameState(newGameState);
    });

    newSocket.on('error', ({ message }) => {
      console.error('Socket error:', message);
    });

    return () => {
      newSocket.close();
    };
  }, [gameId]);

  const makeMove = (from: string, to: string, promotion?: string) => {
    if (!socket) return false;

    socket.emit('send_move', {
      playerId: user?.id,
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/game/${gameId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log(data);
      alert(data.message);
    } catch (error) {
      console.error("Error joining game:", error);
      alert("Failed to join the game.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex justify-around">
        <div className="w-[25vw] border text-white">
          game id: {currentGameId}
        </div>
        <div className="flex h-max">
          <ChessBoard
            gameFen={gameState.fen}
            playerColor={'black'}
            handlePieceDrop={makeMove}
          />
        </div>
        <div className="w-[25vw] h-[93vh] px-5 flex flex-col justify-between">
          <div className="flex flex-col w-full h-[90%] gap-3">
            <MoveHistory moves={[]} />
            <Chat />
          </div>
          <div className="h-[7%] justify-center flex flex-col">
            <GameButtons />
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
              onClick={startGame}
            >
              Start Game
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default GameRoom;
