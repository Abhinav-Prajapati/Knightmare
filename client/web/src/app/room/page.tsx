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
import GameOverPopup from '@/components/GameOverPopup';

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

const WebSocketComponent: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    move_history: [],
    playerColor: 'white',
    white_player_id: null,
    black_player_id: null,
    game_over_status: null,
    turn: 'white'
  });


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

  const { token, user, isAuthenticated } = useAuthStore();
  const { currentGameId } = useGameStore();
  const [gameCreated, setGameCreated] = useState(false);
  const [side, setSide] = useState<'white' | 'black'>('white');

  useEffect(() => {
    if (!isAuthenticated) return;

    const newSocket = io(process.env.NEXT_PUBLIC_API_BASE_URL!, {
      transports: ['websocket'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      if (currentGameId) {
        newSocket.emit('join_room', currentGameId);
        setGameCreated(true);
      }
    });

    newSocket.on('game_state', ({ gameState: newGameState }) => {
      setGameState(newGameState);

      // Set player side based on player IDs
      if (user?.id) {
        if (newGameState.white_player_id === user.id) {
          setSide('white');
        } else if (newGameState.black_player_id === user.id) {
          setSide('black');
        }
      }
    });

    newSocket.on('error', ({ message }) => {
      console.error('Socket error:', message);
    });

    return () => {
      newSocket.close();
    };
  }, [currentGameId, token, user?.id]);

  const makeMove = (from: string, to: string, promotion?: string) => {
    if (!socket || !currentGameId || !user?.id) return false;

    socket.emit('send_move', {
      roomId: currentGameId,
      playerId: user.id,
      move_from: from,
      move_to: to,
      promotion: null,
    });

    return true;
  };

  return (
    <>
      <Navbar />
      <div className="flex justify-around">
        {/* Left Section: Game Status */}
        <div className="w-[25vw] bg-[#36454F4d] mb-12 rounded-2xl p-4">
          <p className="text-sm text-gray-600 px-4 py-2">
            Game status and events will be displayed here.
          </p>
          <p className="text-sm text-gray-600 px-4 py-2">
            Playing as: {side}
          </p>
        </div>

        {/* Center Section: Chess Board */}
        <div className="flex h-max">
          <ChessBoard
            gameFen={gameState.fen}
            playerColor={side}
            handlePieceDrop={makeMove}
            highlightedSquares={highlightSquares}
          />
        </div>

        {/* Right Section */}
        <div className="w-[25vw] h-[93vh] px-5 flex flex-col justify-between">
          {!gameCreated ? (
            <div className="flex flex-col w-full h-[90%]">
              <ChallengeLink />
            </div>
          ) : (
            <div className="flex flex-col w-full h-[90%] gap-3">
              <MoveHistory moves={gameState.move_history} />
              <Chat />
              <div className="h-[7%] justify-center flex flex-col">
                <GameButtons />
              </div>
            </div>
          )}
        </div>
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

export default WebSocketComponent;

