'use client';

import * as Slider from "@radix-ui/react-slider";
import { useState, useEffect } from "react";
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '@/store/auth';
import { useGameStore } from '@/store/game';
import { PlayerColor } from '@/types/game';
import Image from "next/image";

const punchlines = [
  "Even your grandma could beat you at this level.",
  "Stockfish is holding back… a lot. You'll still lose.",
  "You finally stopped hanging pieces? Impressive.",
  "Ah, you think you're good? That's adorable.",
  "Blundering in style won't save you now.",
  "Stockfish is barely trying. You still stand no chance.",
  "Why are you even here? This is pain incarnate.",
  "You vs. Stockfish. The fastest checkmate of your life.",
];

export default function CreateComputerGame({ onGameCreated }: { onGameCreated: any }) {
  const [level, setLevel] = useState(1);
  const [playAs, setPlayAs] = useState(PlayerColor.WHITE);
  const [selectedOption, setSelectedOption] = useState("white"); // 'white', 'black', or 'random'
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { token, user, isAuthenticated } = useAuthStore();
  const { setCurrentGameId, setPlayerColor, setComputerLevel } = useGameStore();

  // TanStack Query mutation for creating an engine game
  const createGameMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/game/engine`,
        {
          level,
          playAs,
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
      setPlayerColor(playAs)
      setComputerLevel(level)
      console.log(`Game created with ID: ${gameId}`);
      setErrorMessage(null);

      // Call the callback to notify parent component TODO: remvoe this bullshit callback hell from here
      if (onGameCreated) {
        onGameCreated(gameId, playAs);
      }
    },
    onError: (error: any) => {
      console.error('Failed to create engine game:', error);
      setErrorMessage('Failed to create game. Please try again.');
    }
  });

  // Create a new game against the engine
  const createEngineGame = () => {
    if (!isAuthenticated || !user?.id) {
      setErrorMessage('You must be logged in to create a game');
      return;
    }

    createGameMutation.mutate();
  };

  // Handle color selection
  const handleColorSelect = (color: PlayerColor, option: string) => {
    setPlayAs(color);
    setSelectedOption(option);
  };

  // Handle random color selection
  const handleRandomColor = () => {
    const colors = [PlayerColor.WHITE, PlayerColor.BLACK];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setPlayAs(randomColor);
    setSelectedOption("random");

    // The UI won't show which color was selected, only that "random" is highlighted
  };

  return (
    <div className="flex flex-col w-full h-max frost-blur p-6 rounded-xl border border-gray-400/30">
      <h2 className="text-2xl text-white mb-4">Play with Computer</h2>

      <div className="mb-6">
        <div className="flex items-center mb-2 gap-2 ">
          <span className=" text-white text-lg flex flex-row ">
            {`level ${level}`}
          </span>
          <Slider.Root
            className="relative flex h-5 w-2/3 touch-none select-none items-center"
            value={[level]}
            onValueChange={(val) => setLevel(val[0])}
            max={8}
            step={1}
          >
            <Slider.Track className="relative h-[3px] grow rounded-full bg-gray-600">
              <Slider.Range className="absolute h-full rounded-full bg-blue-500" />
            </Slider.Track>
            <Slider.Thumb
              className="block size-5 rounded-[10px] bg-white shadow-[0_2px_10px] shadow-blackA4 hover:bg-violet3 focus:shadow-[0_0_0_5px] focus:shadow-blackA5 focus:outline-none"
              aria-label="Level"
            />
          </Slider.Root>
        </div>
        <p className="mt-3 text-center text-gray-200">
          <span className="italic text-blue-300">{punchlines[level - 1]}</span>
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Play as
        </label>
        <div className="flex gap-4 justify-center items-center">
          {/* White Piece Button */}
          <div
            className={`relative cursor-pointer rounded-lg p-1 transition-all ${selectedOption === "white" ? "border-2 border-blue-500" : "border-2 border-transparent hover:border-gray-500"
              }`}
            onClick={() => handleColorSelect(PlayerColor.WHITE, "white")}
          >
            <div className="bg-gray-700 rounded-lg p-2">
              <Image
                src="/images/white-queen.png"
                alt="White"
                width={55}
                height={55}
              />
            </div>
          </div>
          {/* Random Button */}
          <div
            className={`relative cursor-pointer rounded-lg p-1 transition-all ${selectedOption === "random" ? "border-2 border-blue-500" : "border-2 border-transparent hover:border-gray-500"
              }`}
            onClick={handleRandomColor}
          >
            <div className="bg-gray-700 rounded-lg p-2">
              <Image
                src="/images/random.png"
                alt="Random"
                width={70}
                height={70}
              />
            </div>
          </div>

          {/* Black Piece Button */}
          <div
            className={`relative cursor-pointer rounded-lg p-1 transition-all ${selectedOption === "black" ? "border-2 border-blue-500" : "border-2 border-transparent hover:border-gray-500"
              }`}
            onClick={() => handleColorSelect(PlayerColor.BLACK, "black")}
          >
            <div className="bg-gray-700 rounded-lg p-2">
              <Image
                src="/images/black-queen.png"
                alt="Black"
                width={55}
                height={55}
              />
            </div>
          </div>

        </div>
      </div>


      <button
        className="mt-2 bg-blue-600 text-white py-3 px-4 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        onClick={createEngineGame}
        disabled={createGameMutation.isPending || !isAuthenticated}
      >
        {createGameMutation.isPending ? "Creating game..." : "Start Game"}
      </button>
      {errorMessage && (
        <div className="text-sm text-red-500 px-4 py-2 mb-4 bg-red-500/10 rounded">
          {errorMessage}
        </div>
      )}
    </div>
  );
}