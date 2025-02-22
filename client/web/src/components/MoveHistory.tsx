import React, { useEffect, useRef } from 'react';

const MoveHistorySegment = ({ index, move1, move2 }: { index: number; move1: string; move2?: string }) => {
  return (
    <div className="relative py-2 flex">
      <span className="text-white/50 text-2xl">{index + 1}.</span>
      <span className="text-white/80 text-2xl px-2">{move1}</span>
      {move2 && <span className="text-white/80 text-2xl px-2">{move2}</span>}
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
    <div className="bg-[#36454F4d] font-poppins pb-5 rounded-2xl flex flex-col items-center px-7 h-[50%]">
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
              index={i / 2}
              move1={moves[i]}
              move2={moves[i + 1]}
            />
          ) : null
        )}
      </div>
    </div>
  );
};

export default MoveHistory;
