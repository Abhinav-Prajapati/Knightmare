import React from 'react'
import UserProfile from './UserProfile'

const Navbar = () => {
  return (
    <div className='w-full h-[7vh] flex items-center justify-between'>
      {/* logo  */}
      <div className="flex w-max text-4xl items-end mx-4">
        <span className=' textgrad font-semibold bg-gradient-to-r to-[#A348DF] from-[#7143E2] bg-clip-text text-transparent '>Quick</span>
        <span className='text-white/80 text-3xl'>Chess</span>
      </div>
      <UserProfile/>
    </div>
  )
}

export default Navbar