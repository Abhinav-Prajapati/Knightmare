'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useGameStore } from '@/store/game';
import ChessBoard from '@/components/ChessBoard';
import GameButtons from '@/components/GameButtons';
import MoveHistory from '@/components/MoveHistory';
import GameOverPopup from '@/components/GameOverPopup';
import ChessPlayerCard from '@/components/game/ChessPlayerCard';
import { ChessSocketClient } from '@/utils/ChessSocketClient';
import { PlayerColor } from '@/types/game';
import { DEFAULT_POSITION } from 'chess.js';
import CreateComputerGame from '@/components/CreateComputerGame';

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
    fen: DEFAULT_POSITION,
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
      [from]: { backgroundColor: "rgba(0, 255, 0, 0.5)" },
      [to]: { backgroundColor: "rgba(0, 255, 0, 0.5)" }
    });
  };

  // Track game creation status
  const [gameCreated, setGameCreated] = useState(false);
  const { token, user, isAuthenticated } = useAuthStore();
  const { currentGameId, setCurrentGameId } = useGameStore();
  const [side, setSide] = useState<'white' | 'black'>('white');

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
  }, [gameState.moveHistory, gameState.gameOverStatus?.isGameOver, socketClient]);

  // Initialize socket client when authenticated
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
      client.joinGame(currentGameId, side === 'white' ? PlayerColor.WHITE : PlayerColor.BLACK)
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

  // Make a move in the game
  const makeMove = (UCIMove: string) => {
    if (!socketClient || !currentGameId || !user?.id) return false;

    socketClient.sendMove({
      gameId: currentGameId,
      UCImove: UCIMove
    }).catch((error) => {
      setErrorMessage(`Move failed: ${error.message}`);
    });

    return true;
  };

  // Handle game creation from CreateComputerGame component
  const handleGameCreated = (gameId: string, playerColor: PlayerColor) => {
    setGameCreated(true);
    setSide(playerColor === PlayerColor.WHITE ? 'white' : 'black');

    if (socketClient) {
      socketClient.joinGame(gameId, playerColor)
        .catch((error) => {
          setErrorMessage(`Failed to join game: ${error.message}`);
        });
    }
  };

  // Handle manual reconnection
  const handleReconnect = () => {
    if (socketClient) {
      socketClient.connect();

      if (currentGameId) {
        socketClient.joinGame(currentGameId, side === 'white' ? PlayerColor.WHITE : PlayerColor.BLACK)
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
      <div className="flex justify-center gap-4 items-center px-4 h-screen">
        {/* Left Section: Game Status or Game Creation */}
        <div className="w-1/6 h-max">
          {!gameCreated ? (
            <></>
          ) : (
            <div className="frost-blur border-[1px] border-gray-400/30 rounded-xl">
              <div className="text-sm text-gray-200">
                <div className="p-4">
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
                    Playing as: {side}
                  </p>
                </div>
              </div>
              <ChessPlayerCard
                profileUrl="/text-profile-pic.jpg"
                username={user?.username || "You"}
                countryFlagUrl="/flags/usa.png"
                time="00:08:09"
                capturedPieces={[]}
                rating={100}
              />
            </div>
          )}
        </div>

        {/* Center Section: Chess Board */}
        <div className="flex h-max">
          <ChessBoard
            gameFen={gameState.fen}
            playerColor={side}
            sendUCIChessMove={makeMove}
            highlightedSquares={highlightSquares}
            enableChessBoard={gameCreated}
          />
        </div>

        {/* Right Section: Move History */}
        {!gameCreated ? (
          <div className="w-1/4">
            <CreateComputerGame onGameCreated={handleGameCreated} />
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