"use client";

import { Chess, DEFAULT_POSITION, Square } from 'chess.js'
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import toast from 'react-hot-toast';

interface ChessBoardProps {
  gameFen: string;
  playerColor: any;
  sendUCIChessMove: (UCIMove: string) => void;
  highlightedSquares?: Record<string, React.CSSProperties>;
  enableChessBoard: boolean;
}

/**
 * ChessBoard component that renders an interactive chess board.
 * Supports both drag-and-drop and click-to-move functionality.
 * Shows valid moves with dots when a piece is selected and highlights squares on hover.
 * Can be enabled or disabled to prevent piece movement.
 * 
 * @param gameFen - FEN string representing the current board state
 * @param playerColor - The color of the player ('white' or 'black')
 * @param handlePieceDrop - Callback function when a piece is moved
 * @param highlightedSquares - Optional squares to highlight with custom styles
 * @param enableChessBoard - Boolean to enable or disable the chess board
 * @returns React component
 */
const ChessBoard: React.FC<ChessBoardProps> = ({
  gameFen,
  playerColor,
  sendUCIChessMove,
  highlightedSquares = {},
  enableChessBoard,
}) => {

  const chessRef = useRef(new Chess())
  const [fen, setFen] = useState<string>(DEFAULT_POSITION)
  const [lastServerFen, setLastServerFen] = useState<string>(DEFAULT_POSITION);
  const [isMovePending, setIsMovePending] = useState<boolean>(false);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Record<string, React.CSSProperties>>({});
  const [hoveredSquare, setHoveredSquare] = useState<Square | null>(null);

  const lightSquareColor = "#ffffffb3";
  const darkSquareColor = "#D9D9D933";

  /**
   * Synchronize the board with the FEN string received from the server
   * Handles error recovery if an invalid FEN is received
   */
  useEffect(() => {
    try {
      setLastServerFen(gameFen)
      chessRef.current.load(gameFen)
      setFen(chessRef.current.fen())
      setIsMovePending(false);
      console.log(`New FEN received from server: ${gameFen}`);
    } catch (e) {
      console.error("Invalid FEN received:", e);
      toast.error("Received invalid game state. Trying to recover...");

      try {
        chessRef.current.load(lastServerFen);
        setFen(chessRef.current.fen());
      } catch (recoveryError) {
        chessRef.current.load(DEFAULT_POSITION);
        setFen(DEFAULT_POSITION);
        toast.error("Could not recover game state. Board has been reset.");
      }
    }
  }, [gameFen, lastServerFen])

  /**
   * Optimistically update the FEN locally before server confirmation
   * Validates moves and prevents invalid actions
   * Checks if the board is enabled before allowing moves
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
      // is promotion possbible is use casue ther is bug in chessboard.js which 
      // return king move as a promotion move so here we are menuly testing it

      const isPromotionPossible = piece &&
        piece.type === 'p' &&
        ((piece.color === 'w' && to[1] === '8') ||
          (piece.color === 'b' && to[1] === '1'));

      promotion = promotion && isPromotionPossible ? promotion[1].toLocaleLowerCase() : undefined;

      const currentTurn = chessRef.current.turn() === 'w' ? 'white' : 'black';

      console.log(`move ${from}${to}${promotion || ""}`)
      if (currentTurn !== playerColor) {
        toast.error("Not your turn");
        return false;
      }

      const uciMove = `${from}${to}${promotion ? promotion : ""}`

      const validMove = chessRef.current.move(uciMove);
      if (!validMove) {
        toast.error("Invalid move");
        return false;
      }

      setFen(chessRef.current.fen());
      setIsMovePending(true);
      setSelectedSquare(null);
      setPossibleMoves({});

      sendUCIChessMove(uciMove);
      return true
    } catch (error) {
      console.error('Invalid move:', error);
      toast.error("That's not a valid move");
      return false;
    }
  }, [sendUCIChessMove, isMovePending, playerColor])

  /**
   * Reconcile local state with server state if they differ
   */
  useEffect(() => {
    if (!isMovePending && fen !== gameFen) {
      console.log("State mismatch detected, reconciling with server state");
      try {
        chessRef.current.load(gameFen);
        setFen(chessRef.current.fen());
      } catch (error) {
        console.error("Reconciliation failed:", error);
      }
    }
  }, [fen, gameFen, isMovePending]);

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
   * Shows possible moves with dots when a piece is selected
   * Prevents actions when the board is disabled
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
    const pieceColor = pieceOnSquare.color === 'w' ? 'white' : 'black';
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
   * Only shows hover effects when board is enabled
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
    <div className="relative rounded-[0.5rem] h-max w-max p-4 bg-[#2F2B28] border-[1px] border-gray-400/30">
      <Chessboard
        id="BasicBoard"
        position={fen}
        boardOrientation={playerColor.toLowerCase()}
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