"use client";
// TODO: add enable flag to block all peacs before game starts
import { Chess, DEFAULT_POSITION, Square } from 'chess.js'
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import toast from 'react-hot-toast';

interface ChessBoardProps {
  gameFen: any;
  playerColor: any;
  handlePieceDrop?: any;
  highlightedSquares?: Record<string, React.CSSProperties>; // ✅ Ensure object type
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  gameFen,
  playerColor,
  handlePieceDrop,
  highlightedSquares = {},
}) => {

  const chessRef = useRef(new Chess())
  const [fen, setFen] = useState<string>(DEFAULT_POSITION)
  const [lastServerFen, setLastServerFen] = useState<string>(DEFAULT_POSITION);
  const [isMovePending, setIsMovePending] = useState<boolean>(false);
  const lightSquareColor = "#ffffffb3";
  const darkSquareColor = "#D9D9D933";
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Record<string, React.CSSProperties>>({});

  useEffect(() => {
    try {
      // Store the server FEN for reconciliation if needed
      setLastServerFen(gameFen)

      // Validate FEN by trying to load it 
      chessRef.current.load(gameFen)

      // Update local state and move
      setFen(chessRef.current.fen())
      // Reset move pending state when server confirms a move
      setIsMovePending(false);

      console.log(`New FEN received from server: ${gameFen}`);
    } catch (e) {
      console.error("Invalid FEN received:", e);
      toast.error("Received invalid game state. Trying to recover...");

      // Try to recover using last known good state
      try {
        chessRef.current.load(lastServerFen);
        setFen(chessRef.current.fen());
      } catch (recoveryError) {
        // If recovery fails, reset to default position as last resort
        chessRef.current.load(DEFAULT_POSITION);
        setFen(DEFAULT_POSITION);
        toast.error("Could not recover game state. Board has been reset.");
      }
    }
  }, [gameFen, lastServerFen])

  const optmesticFenUpdate = useCallback((from: string, to: string, promotion?: string) => {
    // Prevent move spam
    if (isMovePending) {
      toast.error("Move already in progress, please wait");
      return false;
    }

    console.log(`Move attempt: ${from}->${to}${promotion ? ` (promotion: ${promotion})` : ''}`);
    try {
      // Check whose turn it is
      const currentTurn = chessRef.current.turn() === 'w' ? 'white' : 'black';
      if (currentTurn !== playerColor) {
        toast.error("Not your turn");
        return false;
      }
      // Validate move is legal before applying
      const moveObject = {
        from,
        to,
        promotion: promotion || undefined
      };

      // Check if move is valid
      const validMove = chessRef.current.move(moveObject);
      if (!validMove) {
        toast.error("Invalid move");
        return false;
      }

      // Update local state
      setFen(chessRef.current.fen());
      setIsMovePending(true);

      // Notify parent component
      handlePieceDrop(from, to, promotion);

      return true
    } catch (error) {
      console.error('Invalid move:', error);
      toast.error("That's not a valid move");
      return false;
    }
  }, [handlePieceDrop, isMovePending, playerColor])

  // State reconciliation function
  useEffect(() => {
    // If local and server state differ while no move is pending, reconcile
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

  const handleSquareClick = (currentSquare: Square) => {
    console.log('Square clicked:', currentSquare);

    // Get the piece on the clicked square
    const pieceOnSquare = chessRef.current.get(currentSquare);

    // Clear previous highlights if clicking on an empty square or a different square
    if (!pieceOnSquare || selectedSquare !== currentSquare) {
      // If there's a piece on this square, select it and show moves
      if (pieceOnSquare) {
        setSelectedSquare(currentSquare);

        // Get possible moves for this piece
        const moves = chessRef.current.moves({
          square: currentSquare,
          verbose: true // Need verbose to get 'to' squares
        });

        // Create highlights
        const newHighlights: Record<string, React.CSSProperties> = {};

        // Highlight selected square
        newHighlights[currentSquare] = {
          backgroundColor: 'rgba(255, 255, 0, 0.4)'
        };

        // Add dots to possible destination squares
        moves.forEach((move: any) => {
          newHighlights[move.to] = {
            background: 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)'
          };
        });

        setPossibleMoves(newHighlights);
      } else {
        // Clicking on empty square - clear selection
        setSelectedSquare(null);
        setPossibleMoves({});
      }
    } else {
      // Clicking on the already selected square - deselect it
      setSelectedSquare(null);
      setPossibleMoves({});
    }
  };

  return (
    <div className="relative rounded-sm h-max w-max p-4">
      {/* Blurred Background */}
      <div className="absolute inset-0 bg-gradient-to-tr to-[#4e3e51]/80 from-[#c47373]/80 z-[-1] backdrop-blur-sm"></div>

      {/* Chessboard (on top) */}
      <div className="relative z-10 p-4 rounded-sm border h-max w-max">
        <Chessboard
          id="BasicBoard"
          position={fen}
          boardOrientation={playerColor.toLowerCase()}
          customDarkSquareStyle={{ backgroundColor: darkSquareColor }}
          customLightSquareStyle={{ backgroundColor: lightSquareColor }}
          customSquareStyles={{ ...highlightedSquares, ...possibleMoves }}
          boardWidth={790}
          onPieceDrop={optmesticFenUpdate}
          onSquareClick={handleSquareClick}
        />
      </div>
    </div>
  );
};

export default ChessBoard;
