import { ChevronDown } from 'lucide-react'
import Image from 'next/image'
import React from 'react'
import DummyPrifileImage from "../../public/text-profile-pic.jpg"

const UserProfile = () => {
  return (
    <div className=" text-white/70  w-40  flex items-center  mx-3 rounded-md bg-BUTTON-dark ">
      <div className="flex items-center">
        {/* priofile photo  */}
        <div className="h-10 w-10 overflow-hidden rounded-md m-1">
          <Image alt='test profile image' src={DummyPrifileImage}/>
        </div>
        {/* user name  */}
        <span className='text-lg'>{"User483"}</span>
        <ChevronDown size={30} />
      </div>
    </div>
  )
}

export default UserProfile