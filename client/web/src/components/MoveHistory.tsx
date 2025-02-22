import React, { useEffect, useRef } from 'react';
import convertMoveToSymbol from '@/utils/utils';

const MoveHistorySegment = ({ index, move1, move2, isLatestMove }: { index: number; move1: string; move2?: string; isLatestMove: boolean }) => {
  const whiteMove = convertMoveToSymbol(move1)
  let blackMove = null
  if (move2) {
    blackMove = convertMoveToSymbol(move2)
  }

  return (
    <div className={`relative py-2 flex border-b-[1px] ${isLatestMove ? 'border-white/0' : 'border-white/20'}`}>
      <span className="text-white/50 text-xl w-[10%]">{(index / 2) + 1}.</span>
      <span className={`text-white/80 text-xl px-2 w-[45%] ${(isLatestMove && index % 2 == 1) ? 'border' : ''}`}>
        <span className='text-2xl inline-block '>{whiteMove.symbol}</span>
        <span>{whiteMove.square}</span>
      </span>
      {
        blackMove &&
        <span className={`text-white/80 text-xl px-2 w-[45%] ${(isLatestMove && index % 2 == 0) ? 'border' : ''}`}>
          <span className='text-2xl  inline-block '>{blackMove.symbol}</span>
          <span>{blackMove.square}</span>
        </span>
        // TODO: remove this blackMove by converting entire move history to grid with 2 colmums [ ] 
      }
    </div>
  );
};

const MoveHistory = ({ moves }: { moves: string[] }) => {
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [moves]); // Auto-scroll when `moves` updates

  return (
    <div className="bg-[#36454F4d] font-poppins pb-2 px-5 rounded-xl flex flex-col items-center h-full">
      {/* Header */}
      <div className="border-b border-white/40 w-full h-16 flex items-center">
        <span className="text-white/70 text-2xl">Move History</span>
      </div>

      {/* Move history */}
      <div
        ref={historyRef}
        className="w-full overflow-y-auto"
        style={{
          maxHeight: '400px',
          scrollbarWidth: 'none', // Hide scrollbar (Firefox)
          msOverflowStyle: 'none', // Hide scrollbar (IE)
        }}
      >
        {/* Hide scrollbar for Webkit-based browsers */}
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
              isLatestMove={i === moves.length - 1 || i === moves.length - 2}
            />
          ) : null
        )}
      </div>
    </div>
  );
};

export default MoveHistory;
