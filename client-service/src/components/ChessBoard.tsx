"use client";

import { Chess, Square } from 'chess.js'
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import toast from 'react-hot-toast';
import { useGameBoard, useGameStatus, useGameStore, PlayerColor } from '@/store/game';

interface ChessBoardProps {
  sendUCIChessMove: (UCIMove: string) => void;
  highlightedSquares?: Record<string, React.CSSProperties>;
}

/**
 * ChessBoard component that renders an interactive chess board.
 * Uses Zustand store for state management.
 * 
 * @param sendUCIChessMove - Callback function to send moves to the server
 * @param highlightedSquares - Optional squares to highlight with custom styles
 * @returns React component
 */
const ChessBoard: React.FC<ChessBoardProps> = ({
  sendUCIChessMove,
  highlightedSquares = {},
}) => {
  const chessRef = useRef(new Chess());
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Record<string, React.CSSProperties>>({});
  const [hoveredSquare, setHoveredSquare] = useState<Square | null>(null);
  const [isMovePending, setIsMovePending] = useState<boolean>(false);

  // Get state from Zustand store
  const { fen, updateFen, addMove } = useGameBoard();
  const { status } = useGameStatus();
  const playerColor = useGameStore(state => state.playerColor);
  const isInGame = useGameStore(state => state.isInGame());
  const getCurrentTurn = useGameStore(state => state.getCurrentTurn);

  const lightSquareColor = "#ffffffb3";
  const darkSquareColor = "#D9D9D933";

  // Convert playerColor from PlayerColor enum to 'white' or 'black' string for the chessboard component
  const boardOrientation = playerColor === PlayerColor.WHITE ? 'white' : 'black';

  // Determine if the board should be enabled
  const enableChessBoard = isInGame && status !== 'checkmate' && status !== 'stalemate' && status !== 'draw';

  /**
   * Synchronize the board with the FEN string from the store
   */
  useEffect(() => {
    try {
      chessRef.current.load(fen);
      setIsMovePending(false);
    } catch (e) {
      console.error("Invalid FEN received:", e);
      toast.error("Received invalid game state. Trying to recover...");
    }
  }, [fen]);

  /**
   * Optimistically update the FEN locally before server confirmation
   * 
   * @param from - Starting square
   * @param to - Target square
   * @param promotion - Optional promotion piece
   * @returns boolean indicating if the move was valid
   */
  const optimisticFenUpdate = useCallback((from: string, to: string, promotion?: string) => {
    // Check if the chess board is disabled
    if (!enableChessBoard) {
      toast.error("Chess board is currently disabled");
      return false;
    }

    if (isMovePending) {
      toast.error("Move already in progress, please wait");
      return false;
    }

    console.log(`Move attempt: ${from}->${to}${promotion ? ` (promotion: ${promotion})` : ''}`);
    try {
      const piece = chessRef.current.get(from as Square);

      // Check if promotion is possible
      const isPromotionPossible = piece &&
        piece.type === 'p' &&
        ((piece.color === 'w' && to[1] === '8') ||
          (piece.color === 'b' && to[1] === '1'));

      promotion = promotion && isPromotionPossible ? promotion[1].toLocaleLowerCase() : undefined;

      const currentTurn = getCurrentTurn();

      if (currentTurn !== playerColor) {
        toast.error("Not your turn");
        return false;
      }

      const uciMove = `${from}${to}${promotion ? promotion : ""}`;

      const validMove = chessRef.current.move(uciMove);
      if (!validMove) {
        toast.error("Invalid move");
        return false;
      }

      // Update local state
      const newFen = chessRef.current.fen();
      updateFen(newFen);

      setIsMovePending(true);
      setSelectedSquare(null);
      setPossibleMoves({});

      // Send move to server
      sendUCIChessMove(uciMove);

      // Add move to history
      addMove(uciMove, validMove.san, newFen);

      return true;
    } catch (error) {
      console.error('Invalid move:', error);
      toast.error("That's not a valid move");
      return false;
    }
  }, [sendUCIChessMove, isMovePending, playerColor, enableChessBoard, getCurrentTurn, updateFen, addMove]);

  /**
   * Clear selected square and possible moves when board is disabled
   */
  useEffect(() => {
    if (!enableChessBoard) {
      setSelectedSquare(null);
      setPossibleMoves({});
    }
  }, [enableChessBoard]);

  /**
   * Handle square clicks for both piece selection and move execution
   * 
   * @param currentSquare - The square that was clicked
   */
  const handleSquareClick = (currentSquare: Square) => {
    // Check if the chess board is disabled
    if (!enableChessBoard) {
      return;
    }

    const pieceOnSquare = chessRef.current.get(currentSquare);

    // If a square was already selected, try to move to the clicked square
    if (selectedSquare && selectedSquare !== currentSquare) {
      const moveResult = optimisticFenUpdate(selectedSquare, currentSquare);
      if (moveResult) {
        return;
      }
    }

    // Clear previous selection if clicking empty square or same square twice
    if (!pieceOnSquare || selectedSquare === currentSquare) {
      setSelectedSquare(null);
      setPossibleMoves({});
      return;
    }

    // Only allow selecting own pieces
    const pieceColor = pieceOnSquare.color === 'w' ? PlayerColor.WHITE : PlayerColor.BLACK;
    if (pieceColor !== playerColor) {
      toast.error("You can only move your own pieces");
      return;
    }

    // Set as selected square and show possible moves
    setSelectedSquare(currentSquare);
    showPossibleMoves(currentSquare);
  };

  /**
   * Highlight valid destinations for a selected piece
   * 
   * @param square - The square containing the piece to show moves for
   */
  const showPossibleMoves = (square: Square) => {
    const moves = chessRef.current.moves({
      square: square,
      verbose: true
    });

    const newHighlights: Record<string, React.CSSProperties> = {};

    // Highlight selected square
    newHighlights[square] = {
      backgroundColor: 'rgba(255, 255, 0, 0.4)'
    };

    // Add dots to possible destination squares
    moves.forEach((move: any) => {
      newHighlights[move.to] = {
        background: 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)'
      };
    });

    setPossibleMoves(newHighlights);
  };

  /**
   * Handle mouse over events to highlight squares
   * 
   * @param square - The square being hovered
   */
  const handleSquareHover = (square: Square) => {
    if (enableChessBoard) {
      setHoveredSquare(square);
    }
  };

  /**
   * Handle mouse leave events to remove highlights
   */
  const handleSquareLeave = () => {
    setHoveredSquare(null);
  };

  // Combine all custom square styles
  const customSquareStyles: Record<string, React.CSSProperties> = {
    ...highlightedSquares,
    ...possibleMoves,
  };

  // Add hover highlight only when board is enabled
  if (hoveredSquare && enableChessBoard) {
    customSquareStyles[hoveredSquare] = {
      ...customSquareStyles[hoveredSquare],
      backgroundColor: hoveredSquare in possibleMoves
        ? 'rgba(0, 255, 0, 0.3)'
        : 'rgba(173, 216, 230, 0.5)'
    };
  }

  // Add visual indicator when board is disabled
  const boardDisabledOverlay = !enableChessBoard ? (
    <div className="absolute inset-0 bg-black/30 z-20 flex items-center justify-center rounded-sm">
    </div>
  ) : null;

  return (
    <div className="relative rounded-[0.5rem] h-max w-max border-[1px] border-gray-400/30">
      <Chessboard
        id="BasicBoard"
        position={fen}
        boardOrientation={boardOrientation}
        customSquareStyles={customSquareStyles}
        boardWidth={790}
        onPieceDrop={optimisticFenUpdate}
        onSquareClick={handleSquareClick}
        onMouseOverSquare={handleSquareHover}
        onMouseOutSquare={handleSquareLeave}
      />
      {boardDisabledOverlay}
    </div>
  );
};

export default ChessBoard;