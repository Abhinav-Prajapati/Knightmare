import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';
import { useGameStore } from '@/store/game';

interface GameState {
  fen: string;
  moves: string[];
  playerColor: 'white' | 'black';
  isGameOver: boolean;
  winner?: string;
}

export const useGameWebSocket = (roomId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: [],
    playerColor: 'white',
    isGameOver: false
  });
  const { token } = useAuthStore();
  const { setCurrentGameId } = useGameStore();

  useEffect(() => {
    if (!token) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_BASE_URL!, {
      // auth: { token },
      transports: ['websocket']
    });

    setSocket(newSocket);

    // Connect to room if roomId is provided
    if (roomId) {
      newSocket.emit('join_room', roomId);
    }

    // Socket event listeners
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    newSocket.on('game_state', ({ gameState: newGameState }) => {
      setGameState(newGameState);
    });

    newSocket.on('error', ({ message }) => {
      console.error('Socket error:', message);
    });

    return () => {
      newSocket.close();
    };
  }, [token, roomId]);

  const makeMove = (from: string, to: string, promotion?: string) => {
    if (!socket || !roomId) return false;

    socket.emit('send_move', {
      playerId: socket.id,
      roomId,
      move_from: from,
      move_to: to,
      promotion
    });

    return true;
  };

  return {
    socket,
    gameState,
    makeMove
  };
};
