import React from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"


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
    < div className=" bg-[#36454F4d]  m-2 pb-5 rounded-2xl flex flex-col items-center px-7 h-max " >
      {/* headder */}
      <div className="border-b border-white/40 w-full h-16 flex items-center">
        <span className='text-white/70 text-2xl '>Move History</span>
      </div>
      {/* move history */}
      <div className=" w-full h-max  ">
        <Carousel orientation="vertical"
          opts={{
            align: "start",
            loop: false,
          }} >
          <CarouselContent className='h-[24rem]'>
            {
              // run half the length of the moves array
              Array.from({ length: Math.ceil(moves?.length / 2) })?.map((_, index) => {
                return (
                  <CarouselItem key={index} className='basis-1/8'>
                    <MoveHistorySegment key_={index} moves={moves} />
                  </CarouselItem>
                )
              })
            }
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  )
}

export default MoveHistory