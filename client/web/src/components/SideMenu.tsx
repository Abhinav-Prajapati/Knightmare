'use client'
import { useRouter } from 'next/navigation'
import React from 'react'



const GameSelectionButton = ({ title , link  }: { title: string , link:string }) => {
  const router = useRouter()
  return (
    <div 
    onClick={()=>{router.push(link)}}
    className=" flex  justify-center items-center   bg-[#272A30] h-14 mx-6 rounded-xl cursor-pointer ">
      <span className='text-white/70 text-2xl text-center'>{title}</span>
    </div>
  )
}

const SideMenu = () => {
  return (
    <div className='  h-full   '>
      <div className="  h-full w-[70%] ">
        <div className="flex flex-col gap-y-7">
          <GameSelectionButton title={'Play With Friend'} link={'/room'}  />
          <GameSelectionButton title={'Play With Bot'} link='/'  />
          <GameSelectionButton title={'Pass n Play'} link='/'  />
        </div>
      </div>
    </div>
  )
}

export default SideMenu