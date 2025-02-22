import React, { useEffect, useRef } from 'react';
import convertMoveToSymbol from '@/utils/utils';
import { twMerge } from 'tailwind-merge';

const MoveHistorySegment = ({ index, move1, move2, movesLength }: { index: number; move1: string; move2?: string; movesLength: number }) => {
  const whiteMove = convertMoveToSymbol(move1);
  let blackMove = null;
  if (move2) {
    blackMove = convertMoveToSymbol(move2);
  }

  // Calculate if this segment contains the latest move
  const isLatestSegment = index + (move2 ? 2 : 1) === movesLength;
  const moveNumber = Math.floor(index / 2) + 1;

  return (
    <div className={twMerge("relative py-2 flex border-b-[1px]", isLatestSegment ? 'border-white/0' : 'border-white/20')}>
      <span className="text-white/50 text-xl w-[10%]">{moveNumber}.</span>
      <span className={`text-white/80 text-xl px-2 w-[45%] `}>
        <div className={` w-max ${index === movesLength - 1 ? 'border-b' : ''} `}>
          <span className='text-2xl inline-block'>{whiteMove.symbol}</span>
          <span>{whiteMove.square}</span>
        </div>
      </span>
      {blackMove && (
        <span className={`text-white/80 text-xl px-2 w-[45%] `}>
          <div className={` w-max ${index + 1 === movesLength - 1 ? 'border-b' : ''}`}>
            <span className='text-2xl inline-block'>{blackMove.symbol}</span>
            <span>{blackMove.square}</span>
          </div>
        </span>
      )}
    </div>
  );
};

const MoveHistory = ({ moves }: { moves: string[] }) => {
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [moves]);

  return (
    <div className="bg-[#36454F4d] font-poppins pb-2 px-5 rounded-xl flex flex-col items-center h-full">
      <div className="border-b border-white/40 w-full h-16 flex items-center">
        <span className="text-white/70 text-2xl">Move History</span>
      </div>
      <div
        ref={historyRef}
        className="w-full overflow-y-auto"
        style={{
          maxHeight: '400px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style>
          {`
            ::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>
        {moves.map((_, i) =>
          i % 2 === 0 ? (
            <MoveHistorySegment
              key={i}
              index={i}
              move1={moves[i]}
              move2={moves[i + 1]}
              movesLength={moves.length}
            />
          ) : null
        )}
      </div>
    </div>
  );
};

export default MoveHistory;
