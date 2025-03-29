import React from 'react';

interface GameOverPopupProps {
  gameOverMethod: string; // e.g., "Checkmate", "Resignation", "Timeout"
  winner: string | null; // e.g., "White", "Black", or null for a draw
  showPopup: boolean; // Controls visibility
  setShowPopup: (show: boolean) => void; // Function to update visibility
}

const GameOverPopup: React.FC<GameOverPopupProps> = ({ gameOverMethod, winner, showPopup, setShowPopup }) => {
  if (!showPopup) return null; // Don't render if popup is hidden

  return (
    <div
      className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-20"
      onClick={() => setShowPopup(false)} // Close on clicking outside
    >
      <div
        className="bg-white p-6 rounded-lg shadow-lg text-center relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Close Button (X) */}
        <button
          className="absolute top-2 right-3 text-gray-600 hover:text-red-600 text-xl"
          onClick={() => setShowPopup(false)}
        >
          ×
        </button>

        <h2 className="text-xl font-bold">Game Over</h2>
        <p className="text-lg">Method: {gameOverMethod}</p>
        {winner ? (
          <p className="text-lg font-semibold">Winner: {winner}</p>
        ) : (
          <p className="text-lg font-semibold">The game is a draw!</p>
        )}

        {/* Play Again Button */}
        <button
          onClick={() => {
            setShowPopup(false);
            window.location.reload(); // Example: Reload or trigger a new game
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameOverPopup;
