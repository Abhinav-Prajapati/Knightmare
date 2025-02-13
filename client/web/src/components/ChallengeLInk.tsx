"use client"
import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { ChevronDown, Clock, Crown, Link, Copy, Check } from "lucide-react";
import { useAuthStore } from '@/store/auth';
import { useGameStore } from '@/store/game';
import axios from 'axios';

// Types
type PlayAs = 'white' | 'black' | 'random';
type CreateGameResponse = { game_id: string };

// API function
const createGame = async (playAs: PlayAs, token: string | null): Promise<CreateGameResponse> => {
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await axios.post(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/game/create_game`,
    { playas: playAs },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      }
    }
  );
  return response.data;
};

const ChallengeLink = () => {
  const [selectedColor, setSelectedColor] = React.useState<PlayAs>('white');
  const [copied, setCopied] = React.useState(false);

  const { token } = useAuthStore();
  const { setCurrentGameId, currentGameId, isInGame } = useGameStore();

  const createGameMutation = useMutation({
    mutationFn: () => createGame(selectedColor, token),
    onSuccess: (data) => {
      handleCopyLink(data.game_id);
      setCurrentGameId(data.game_id) // NOTE: commented for debugging
    },
    onError: (error) => {
      if (error instanceof Error && error.message === 'Authentication required') {
        // Handle authentication error specifically
        console.error('Please login to create a game');
      }
    }
  });

  const handleCopyLink = async (gameId: string) => {
    const gameUrl = `${window.location.origin}/room/${gameId}`;
    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const ColorButton = ({ color, children }: { color: PlayAs; children: React.ReactNode }) => (
    <button
      onClick={() => setSelectedColor(color)}
      className={`border-2 hover:border-purple-600 ${selectedColor === color ? 'border-purple-600' : 'border-transparent'
        }`}
    >
      {children}
    </button>
  );

  // Render auth error if no token
  const renderError = () => {
    if (createGameMutation.isError) {
      const error = createGameMutation.error;
      if (error instanceof Error && error.message === 'Authentication required') {
        return (
          <span className="text-red-500 mt-2">
            Please login to create a game
          </span>
        );
      }
      return (
        <span className="text-red-500 mt-2">
          Failed to create game. Please try again.
        </span>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#36454F4d] m-2 rounded-2xl flex flex-col items-center px-7 py-4 h-full">
      <Link className="text-white/80 my-3" size={50} />
      <span className="text-[#dfdfdf]/80 text-3xl font-medium my-2">
        Challenge Link
      </span>
      <span className="text-[#dfdfdf]/70 my-2">
        Share link and play with anyone.
      </span>

      {/* Time control */}
      <div className="flex justify-center relative bg-[#272A30] w-full h-16 my-3 rounded-md items-center">
        <div className="flex text-purple-500 gap-x-4">
          <Clock size={30} />
          <span className="text-2xl text-white/80">10 min</span>
        </div>
        <ChevronDown className="text-white/60 absolute right-0 mx-3" size={35} />
      </div>

      {/* Color selection */}
      <div className="flex gap-1 items-center justify-between w-full">
        <span className="text-white/80 text-2xl">Play as</span>
        <div className="flex">
          <ColorButton color="white">
            <div className="w-16 h-16 bg-white flex justify-center items-center border m-1">
              <Crown size={50} />
            </div>
          </ColorButton>

          <ColorButton color="black">
            <div className="w-16 h-16 bg-black flex justify-center items-center text-white border m-1">
              <Crown size={50} />
            </div>
          </ColorButton>

          <ColorButton color="random">
            <div className="flex relative border m-1">
              <div className="w-8 h-16 bg-white" />
              <div className="w-8 h-16 bg-black" />
            </div>
          </ColorButton>
        </div>
      </div>

      {/* Create and copy link button */}
      <button
        onClick={() => createGameMutation.mutate()}
        disabled={createGameMutation.isPending || copied || !token || isInGame()}
        className="flex justify-center items-center w-full h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md my-3 hover:from-blue-500/70 hover:to-purple-600/70 disabled:opacity-50"
      >
        {isInGame() ? (
          <span className="text-white text-2xl font-medium">Game ongoing</span>
        ) : createGameMutation.isPending ? (
          <span className="text-white text-2xl font-medium">Creating game...</span>
        ) : copied ? (
          <div className="flex gap-2">
            <span className="text-white text-2xl font-medium">Link copied</span>
            <Check size={30} color="white" />
          </div>
        ) : (
          <div className="flex gap-2 text-white">
            <Copy strokeWidth={2.5} size={35} />
            <span className="text-white text-2xl font-medium">Copy link</span>
          </div>
        )}
      </button>
      <span className='text-white'>
        {
          currentGameId
        }
      </span>
      {renderError()}
    </div>
  );
};

export default ChallengeLink;
