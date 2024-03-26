// TODO ; remove carousel and make i scroll y then hide the scroll bar and add a function to scroll the div to bottom when the state changes 
import React from 'react'

const MoveHistorySegment = ({ key_, moves }: { key_: number, moves: String[] }) => {
  return (
    <div className=" relative py-2">
      <span className='text-white/50 text-2xl'>{key_ + 1}.</span>
      <span className='text-white/80 text-2xl px-2'>{moves[key_]}</span>
      <span className='text-white/80 text-2xl absolute right-28  '>{moves[key_ + 1]}</span>
    </div>
  )
}

const MoveHistory = ({ moves }: { moves: string[] }) => {
  const whitePiece = { "K": "♚", "Q": "♛", "R": "♜", "B": "♝", "N": "♞", "P": "♟" }
  const blackPiece = { "k": "♔", "q": "♕", "r": "♖", "b": "♗", "n": "♘", "p": "♙" }
  return (
    < div className=" bg-[#36454F4d] pb-5 rounded-2xl flex flex-col items-center px-7   h-[50%] " >
      {/* headder */}
      <div className="border-b border-white/40 w-full h-16 flex items-center">
        <span className='text-white/70 text-2xl '>Move History</span>
      </div>
      {/* move history */}
      <div className="  w-full overflow-y-auto" style={{ maxHeight: '400px', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <MoveHistorySegment key_={1}  moves={moves}/>
          <MoveHistorySegment key_={2}  moves={moves}/>
          <MoveHistorySegment key_={3}  moves={moves}/>
          <MoveHistorySegment key_={4}  moves={moves}/>
          <MoveHistorySegment key_={5}  moves={moves}/>
          <MoveHistorySegment key_={6}  moves={moves}/>
          <MoveHistorySegment key_={7}  moves={moves}/>
          <MoveHistorySegment key_={8}  moves={moves}/>
          <MoveHistorySegment key_={9}  moves={moves}/>
      </div>
    </div>
  )
}

export default MoveHistory