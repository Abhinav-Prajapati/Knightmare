'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useGameStore, useGameBoard, useGameStatus, PlayerColor, GameType, GameStatus } from '@/store/game';
import ChessBoard from '@/components/ChessBoard';
import GameOverPopup from '@/components/GameOverPopup';
import ChessPlayerCard from '@/components/game/ChessPlayerCard';
import { ChessSocketClient } from '@/utils/ChessSocketClient';
import CreateComputerGame from '@/components/CreateComputerGame';
import ChessGameInterface from '@/components/game/MoveHistoryAndProfile';

const SinglePlayerChessComponent: React.FC = () => {
  const [socketClient, setSocketClient] = useState<ChessSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [highlightSquares, setHighlightSquares] = useState({});
  const [showPopup, setShowPopup] = useState(false);

  // Auth store
  const { token, user, isAuthenticated } = useAuthStore();

  // Game store
  const {
    currentGameId,
    playerColor,
    setCurrentGameId,
    setPlayerColor,
    isInGame,
    computerLevel,
    getCurrentTurn,
    addMove,
  } = useGameStore();

  const { fen, moveHistory } = useGameBoard();
  const { status, winner, isDraw, isCheck } = useGameStatus();

  // Derived from playerColor in the store
  const side = playerColor === PlayerColor.WHITE ? 'white' : 'black';

  // Update highlight squares when moves are made
  useEffect(() => {
    if (moveHistory.length > 0) {
      const lastMove = moveHistory[moveHistory.length - 1];

      if (lastMove.uci) {
        const from = lastMove.uci.substring(0, 2);
        const to = lastMove.uci.substring(2, 4);

        setHighlightSquares({
          [from]: { backgroundColor: "rgba(0, 255, 0, 0.5)" },
          [to]: { backgroundColor: "rgba(0, 255, 0, 0.5)" }
        });
      }
    } else {
      setHighlightSquares({});
    }
    // Handle game over
    if (status === 'checkmate' || status === 'stalemate' || status === 'draw') {
      setShowPopup(true);
      socketClient?.disconnect();
    }
  }, [moveHistory, status, socketClient]);

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
      useGameStore.getState().updateFen(newGameState.fen);

      // Update FEN in the store
      const lastMove = newGameState.moveHistory[newGameState.moveHistory.length - 1];

      // Assuming lastMove has uci and san properties
      const uci = lastMove.uci || ''; // Extract UCI if available
      const san = lastMove.san || ''; // Extract SAN if available

      console.log(`${uci} ${san} ${newGameState.moveHistory}`)

      // FIX: also bring uci move from backend 

      // Only add the move if it's valid
      if (san) {
        addMove(uci, san, newGameState.fen);
      }

      // Set player color based on player IDs
      if (user?.id) {
        if (newGameState.whitePlayerId === user.id) {
          setPlayerColor(PlayerColor.WHITE);
        } else if (newGameState.blackPlayerId === user.id) {
          setPlayerColor(PlayerColor.BLACK);
        }
      }

      // Update game status
      if (newGameState.gameOverStatus) {
        const { isInCheckmate, isInStalemate, isInDraw } = newGameState.gameOverStatus;

        if (isInCheckmate) {
          useGameStore.getState().updateGameStatus(GameStatus.CHECKMATE,
            newGameState.turn === 'w' ? PlayerColor.BLACK : PlayerColor.WHITE);
        } else if (isInStalemate) {
          useGameStore.getState().updateGameStatus(GameStatus.STALEMATE);
        } else if (isInDraw) {
          useGameStore.getState().updateGameStatus(GameStatus.DRAW);
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
      client.joinGame(currentGameId, playerColor || PlayerColor.WHITE)
        .catch((error) => {
          setErrorMessage(`Failed to join game: ${error.message}`);
        });
    }

    // Clean up on unmount
    return () => {
      clearInterval(connectionInterval);
      client.disconnect();
    };
  }, [isAuthenticated, user?.id, currentGameId, playerColor, setPlayerColor]);

  // Make a move in the game
  const makeMove = (UCIMove: string) => {
    if (!socketClient || !currentGameId || !user?.id) return false;
    console.log(`level of current game ${computerLevel}`)

    socketClient.sendMove({
      gameId: currentGameId,
      UCImove: UCIMove,
      difficulty: computerLevel
    }).catch((error) => {
      setErrorMessage(`Move failed: ${error.message}`);
    });

    return true;
  };

  // Handle game creation from CreateComputerGame component
  const handleGameCreated = (gameId: string, playerColor: PlayerColor) => {
    setCurrentGameId(gameId);
    setPlayerColor(playerColor);

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
        socketClient.joinGame(currentGameId, playerColor || PlayerColor.WHITE)
          .then(() => {
            console.log('Successfully reconnected and joined game');
          })
          .catch((error) => {
            setErrorMessage(`Failed to rejoin game: ${error.message}`);
          });
      }
    }
  };

  // Determine winner text for GameOverPopup
  const getWinnerText = () => {
    if (winner === PlayerColor.WHITE) return 'White';
    if (winner === PlayerColor.BLACK) return 'Black';
    return '';
  };

  // Determine game over method for GameOverPopup
  const getGameOverMethod = () => {
    if (status === 'checkmate') return 'checkmate';
    if (status === 'stalemate') return 'stalemate';
    if (status === 'draw') return 'draw';
    return '';
  };

  return (
    <>
      <div className="flex justify-center gap-4 items-center px-4 h-screen">
        {/* Left Section: Game Status or Game Creation */}
        <div className="w-1/6 h-max">
          {!isInGame() ? (
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
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Center Section: Chess Board */}
        <div className="flex h-max">
          <ChessBoard
            sendUCIChessMove={makeMove}
            highlightedSquares={highlightSquares}
          />
        </div>

        {/* Right Section: Move History or Game Creation */}
        {!isInGame() ? (
          <div className="w-1/4">
            <CreateComputerGame onGameCreated={handleGameCreated} />
          </div>
        ) : (
          <div className="w-1/4 flex gap-4 h-full items-center">
            {/* this bitch cases hydration error when reloading page */}
            <div className="w-full h-max">
              <ChessGameInterface
                moveHistory={moveHistory}
                player1={{
                  name: user?.username || 'You',
                  rating: 1500,
                  isActive: playerColor === PlayerColor.WHITE
                    ? getCurrentTurn() === PlayerColor.WHITE
                    : getCurrentTurn() === PlayerColor.BLACK
                }}
                player2={{
                  name: 'Computer',
                  rating: computerLevel ? computerLevel * 500 : 1000,
                  isActive: playerColor === PlayerColor.WHITE
                    ? getCurrentTurn() === PlayerColor.BLACK
                    : getCurrentTurn() === PlayerColor.WHITE
                }}
                time1="10:00"
                time2="10:00"
              />
            </div>
          </div>
        )}
      </div>

      <GameOverPopup
        gameOverMethod={getGameOverMethod()}
        winner={getWinnerText()}
        showPopup={showPopup}
        setShowPopup={setShowPopup}
      />
    </>
  );
};

export default SinglePlayerChessComponent;