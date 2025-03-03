'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth';
import { useGameStore } from '@/store/game';
import ChessBoard from '@/components/ChessBoard';
import GameButtons from '@/components/GameButtons';
import MoveHistory from '@/components/MoveHistory';
import Navbar from '@/components/Navbar';
import GameOverPopup from '@/components/GameOverPopup';
import ChessPlayerCard from '@/components/game/ChessPlayerCard';
import { ChessSocketClient } from '@/utils/ChessSocketClient';
import { PlayerColor } from '@/types/game';
import axios from 'axios';

interface GameOverStatus {
  isGameOver: boolean;
  isInCheck: boolean;
  isInCheckmate: boolean;
  isInStalemate: boolean;
  isInDraw: boolean;
}

interface GameState {
  fen: string;
  moveHistory: any[];
  playerColor: 'w' | 'b';
  whitePlayerId: string | null;
  blackPlayerId: string | null;
  gameOverStatus: GameOverStatus | null;
  turn: 'w' | 'b';
}

const SinglePlayerChessComponent: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [socketClient, setSocketClient] = useState<ChessSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moveHistory: [],
    playerColor: 'w',
    whitePlayerId: null,
    blackPlayerId: null,
    gameOverStatus: null,
    turn: 'w'
  });

  const [highlightSquares, setHighlightSquares] = useState({});

  const updateHighlightSquares = (from: string, to: string) => {
    setHighlightSquares({
      [from]: { backgroundColor: "rgba(0, 255, 0, 0.5)" }, // Light green
      [to]: { backgroundColor: "rgba(0, 255, 0, 0.5)" }
    });
  };

  // Track game creation status
  const [gameCreated, setGameCreated] = useState(false);

  // Engine settings
  const [engineSettings, setEngineSettings] = useState({
    level: 10,
    playAs: PlayerColor.WHITE,
  });

  const { token, user, isAuthenticated } = useAuthStore();
  const { currentGameId, setCurrentGameId } = useGameStore();
  const [side, setSide] = useState<'white' | 'black'>('white');

  // TanStack Query mutation for creating an engine game
  const createGameMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/game/engine`,
        {
          level: engineSettings.level,
          playAs: engineSettings.playAs,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    },
    onSuccess: async (data) => {
      const { gameId } = data;
      setCurrentGameId(gameId);
      console.log(`game created room id adsf: ${gameId}`);

      // Connect to the game using our socket client
      console.log('game created alsdfjlk')
      setGameCreated(true);
      setErrorMessage(null);

      if (socketClient) {
        await socketClient.joinGame(gameId, engineSettings.playAs);
      }
    },
    onError: (error: any) => {
      console.error('Failed to create engine game:', error);
      setErrorMessage('Failed to create game. Please try again.');
    }
  });

  // Update highlight squares when moves are made
  useEffect(() => {
    if (gameState.moveHistory.length > 0) {
      const lastMove = gameState.moveHistory[gameState.moveHistory.length - 1];

      if (lastMove.from && lastMove.to) {
        updateHighlightSquares(lastMove.from, lastMove.to);
      }
    } else {
      setHighlightSquares({});
    }

    // Handle game over
    if (gameState.gameOverStatus?.isGameOver) {
      setShowPopup(true);
      socketClient?.disconnect();
    }

    console.log(gameState);
  }, [gameState.moveHistory, gameState.gameOverStatus?.isGameOver, socketClient]);

  // Initialize socket client when authenticated new game is created
  useEffect(() => {
    if (!isAuthenticated) return;

    const client = new ChessSocketClient(process.env.NEXT_PUBLIC_API_BASE_URL!, {
      playerId: user?.id,
      autoConnect: true,
      reconnection: true
    });

    // Register callbacks
    client.onGameStateUpdate((newGameState) => {
      setGameState(newGameState);

      // Set player side based on player IDs
      if (user?.id) {
        if (newGameState.whitePlayerId === user.id) {
          setSide('white');
        } else if (newGameState.blackPlayerId === user.id) {
          setSide('black');
        }
      }

      setErrorMessage(null);
    });

    client.onError((error) => {
      console.error('Socket error:', error.message);
      setErrorMessage(error.message);
    });

    client.onMessage((message) => {
      console.log(`${message.user}: ${message.message}`);
    });

    // Check connection status
    const connectionInterval = setInterval(() => {
      setIsConnected(client.isConnected());
    }, 1000);

    // Store the client
    setSocketClient(client);

    // Join game if there's a current game ID
    if (currentGameId) {
      client.joinGame(currentGameId, engineSettings.playAs)
        .then(() => {
          setGameCreated(true);
        })
        .catch((error) => {
          setErrorMessage(`Failed to join game: ${error.message}`);
        });
    }

    // Clean up on unmount
    return () => {
      clearInterval(connectionInterval);
      client.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  // Create a new game against the engine
  const createEngineGame = () => {
    if (!isAuthenticated || !user?.id) {
      setErrorMessage('You must be logged in to create a game');
      return;
    }

    createGameMutation.mutate();
  };

  // Make a move in the game
  const makeMove = (from: string, to: string, promotion?: string) => {
    if (!socketClient || !currentGameId || !user?.id) return false;

    socketClient.sendMove({
      gameId: currentGameId,
      moveFrom: from,
      moveTo: to,
      promotion: promotion || null
    }).catch((error) => {
      setErrorMessage(`Move failed: ${error.message}`);
    });

    return true;
  };

  // Change engine difficulty level
  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEngineSettings({
      ...engineSettings,
      level: parseInt(e.target.value, 10)
    });
  };

  // Change side to play as
  const handleSideChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEngineSettings({
      ...engineSettings,
      playAs: e.target.value as PlayerColor
    });
  };

  // Handle manual reconnection
  const handleReconnect = () => {
    if (socketClient) {
      socketClient.connect();

      if (currentGameId) {
        socketClient.joinGame(currentGameId, engineSettings.playAs)
          .then(() => {
            console.log('Successfully reconnected and joined game');
          })
          .catch((error) => {
            setErrorMessage(`Failed to rejoin game: ${error.message}`);
          });
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex justify-between px-4 items-center">
        {/* Left Section: Game Status */}
        <div className="w-1/4 ">
          <div className="text-sm text-gray-200  py-2">
            <div className="frost-blur p-4">
              {isConnected ? (
                <span className="text-green-500">Connected</span>
              ) : (
                <div>
                  <span className="text-red-500">Disconnected</span>
                  <button
                    className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
                    onClick={handleReconnect}
                  >
                    Reconnect
                  </button>
                </div>
              )}

              {errorMessage && (
                <div className="text-sm text-red-500 px-4 py-2">
                  Error: {errorMessage}
                </div>
              )}

              <p className="text-sm text-gray-200 py-2">
                {gameCreated
                  ? `Playing as: ${side}`
                  : "Create a new game to start playing"}
              </p>
            </div>
          </div>
          {gameCreated && (
            <ChessPlayerCard
              profileUrl="/text-profile-pic.jpg"
              username={user?.username || "You"}
              countryFlagUrl="/flags/usa.png"
              time="00:08:09"
              capturedPieces={[]}
              rating={100}
            />
          )}
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
        {!gameCreated ? (
          <div className="flex flex-col w-1/4 h-full frost-blur p-4">
            <h2 className="text-xl font-bold mb-4">Play vs Computer</h2>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Engine Difficulty
              </label>
              <select
                className="w-full p-2 border rounded"
                value={engineSettings.level}
                onChange={handleLevelChange}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20].map(level => (
                  <option key={level} value={level}>
                    Level {level}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Play as
              </label>
              <select
                className="w-full p-2 border rounded"
                value={engineSettings.playAs}
                onChange={handleSideChange}
              >
                <option value={PlayerColor.WHITE}>White</option>
                <option value={PlayerColor.BLACK}>Black</option>
              </select>
            </div>

            <button
              className="mt-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              onClick={createEngineGame}
              disabled={createGameMutation.isPending || !isAuthenticated}
            >
              {createGameMutation.isPending ? "Creating game..." : "Start Game"}
            </button>

            {!isAuthenticated && (
              <p className="mt-2 text-red-500 text-sm">
                You must be logged in to play
              </p>
            )}
          </div>
        ) : (
          <div className="w-1/4 flex flex-col gap-4 h-[calc(100vh-theme(spacing.24))]">
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              <div className="h-full">
                <MoveHistory moves={gameState.moveHistory} />
              </div>
            </div>
            <div className="mt-auto">
              <GameButtons />
            </div>
          </div>
        )}
      </div>
      <GameOverPopup
        gameOverMethod={gameState.gameOverStatus?.isInCheckmate
          ? 'checkmate'
          : gameState.gameOverStatus?.isInStalemate
            ? 'stalemate'
            : gameState.gameOverStatus?.isInDraw
              ? 'draw'
              : ''}
        winner={gameState.turn === 'w' ? 'Black' : 'White'}
        showPopup={showPopup}
        setShowPopup={setShowPopup}
      />
    </>
  );
};

export default SinglePlayerChessComponent;