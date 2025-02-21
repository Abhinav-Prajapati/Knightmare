import React, { useEffect, useRef } from 'react';

interface Move {
  from: string;
  to: string;
}

const MoveHistorySegment = ({ index, moves }: { index: number; moves: Move[] }) => {
  return (
    <div className="relative py-2">
      <span className="text-white/50 text-2xl">{index + 1}.</span>
      <span className="text-white/80 text-2xl px-2">{moves[index]?.from} → {moves[index]?.to}</span>
      {moves[index + 1] && (
        <span className="text-white/80 text-2xl absolute right-28">
          {moves[index + 1]?.from} → {moves[index + 1]?.to}
        </span>
      )}
    </div>
  );
};

const MoveHistory = ({ moves }: { moves: Move[] }) => {
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (historyRef.current) {
      historyRef.current.scrollTop = historyRef.current.scrollHeight;
    }
  }, [moves]); // Auto-scroll when `moves` updates

  return (
    <div className="bg-[#36454F4d] pb-5 rounded-2xl flex flex-col items-center px-7 h-[50%]">
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

        {moves.map((move, index) =>
          index % 2 === 0 ? (
            <MoveHistorySegment key={index} index={index} moves={moves} />
          ) : null
        )}
      </div>
    </div>
  );
};

export default MoveHistory;
