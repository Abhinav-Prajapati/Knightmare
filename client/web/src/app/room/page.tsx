'use client';
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth';
import { useGameStore } from '@/store/game';
import ChessBoard from '@/components/ChessBoard';
import ChallengeLink from '@/components/ChallengeLink';
import Chat from '@/components/Chat';
import GameButtons from '@/components/GameButtons';
import MoveHistory from '@/components/MoveHistory';
import Navbar from '@/components/Navbar';

const WebSocketComponent: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState({
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: [],
    playerColor: 'white',
    isGameOver: false,
  });
  const { token, user } = useAuthStore();
  const { currentGameId, setCurrentGameId } = useGameStore();
  const [gameCreated, setGameCreated] = useState(false);

  useEffect(() => {
    if (!token) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_BASE_URL!, {
      transports: ['websocket'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    if (currentGameId !== null) {
      newSocket.emit('join_room', currentGameId);
      console.log(`Game joined: ${currentGameId}`);
      setGameCreated(true); // Hide ChallengeLink and show MoveHistory/Chat
    }

    newSocket.on('game_state', ({ gameState: newGameState }) => {
      setGameState(newGameState);
    });

    newSocket.on('error', ({ message }) => {
      console.error('Socket error:', message);
    });

    return () => {
      newSocket.close();
    };
  }, [currentGameId]);

  const makeMove = (from: string, to: string, promotion?: string) => {
    if (!socket) return false;
    socket.emit('send_move', {
      roomId: currentGameId,
      playerId: user?.id,
      move_from: from,
      move_to: to,
      promotion: null, // TODO: fix this 
    });
    console.log(`Send move to room ID: ${currentGameId}`);
    return true;
  };

  return (
    <>
      <Navbar />
      <div className="flex justify-around">

        {/* Left Section: Dev Log Display */}
        <div className="w-[25vw] bg-[#36454F4d]  mb-12 rounded-2xl p-4">
          <p className="text-sm text-gray-600 px-4 py-2">Game status and events will be displayed here.</p>
        </div>

        {/* Center Section: Chess Board */}
        <div className="flex h-max">
          <ChessBoard
            gameFen={gameState.fen}
            playerColor={'white'}
            handlePieceDrop={makeMove}
          />
        </div>

        {/* Right Section: Challenge Link (hidden after game starts) / MoveHistory + Chat */}
        <div className="w-[25vw] h-[93vh] px-5 flex flex-col justify-between">
          {!gameCreated ? (
            <div className="flex flex-col w-full h-[90%]">
              <ChallengeLink />
            </div>
          ) : (
            <div className="flex flex-col w-full h-[90%] gap-3">
              <MoveHistory moves={[]} />
              <Chat />
              {/* Game Buttons */}
              <div className="h-[7%] justify-center flex flex-col">
                <GameButtons />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WebSocketComponent;

