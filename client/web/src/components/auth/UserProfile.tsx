'use client'
import { useState } from 'react'
import { motion } from "motion/react"
import { AnimatePresence } from "motion/react"
import { ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'

interface userProfileProp {
  name: string
  profileUrl?: string
}

const UserProfilePanel = () => {

  return (
    <div className="w-[20rem] h-[15rem] bg-gray-800 z-40"></div>
  )
}

const UserProfile: React.FC<userProfileProp> = ({ name, profileUrl }) => {
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  return (
    <div
      className="text-white/70 w-40 flex items-center rounded-md bg-BUTTON-dark mr-1 z-40"
      onClick={() => {
        setShowProfilePanel((prevState) => !prevState)
      }}
    >
      <div className="flex items-center justify-left w-full">
        {/* priofile photo  */}
        <div className="h-10 w-10 overflow-hidden rounded-md m-1">
          <Image alt='Profile image' width={40} height={40} src='/text-profile-pic.jpg' />
        </div>
        {/* user name  */}
        <span className='text-lg px-2'>{name}</span>
      </div>

      {/* Chevron with Rotation Animation */}
      <motion.div
        animate={{ rotate: showProfilePanel ? 180 : 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <ChevronDown size={25} />
      </motion.div>

      {
        showProfilePanel ? (
          <div className="absolute top-16 right-0 ">
            <UserProfilePanel />
          </div>
        ) : ""
      }
    </div>
  )
}

export default UserProfile
