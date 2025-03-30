
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { RiRobot2Line, RiHome2Line } from "react-icons/ri";
import { GoPerson } from "react-icons/go";
import { HiOutlineCpuChip } from "react-icons/hi2";

// Sidebar items array
const sidebarItems = [
  { label: "Home", icon: RiHome2Line, link: "/" },
  { label: "Computer", icon: RiRobot2Line, link: "/computer" },
  { label: "Analysis", icon: HiOutlineCpuChip, link: "/analysis" },
  { label: "Profile", icon: GoPerson, link: "/profile" },
];

const Sidebar = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const inactiveIconColor = "#615D5A";

  // Add a small delay to prevent jitter
  const handleHoverStart = () => {
    setIsSidebarExpanded(true);
  };

  const handleHoverEnd = () => {
    setIsSidebarExpanded(false);
  };

  return (
    <motion.div
      className="fixed left-0 top-1/2 -translate-y-1/2 h-1/4 flex flex-col justify-around items-start border-2 border-[#2C2C2A] rounded-r-xl"
      initial={{ width: "60px" }}
      animate={{ width: isSidebarExpanded ? "160px" : "60px" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
    >
      {sidebarItems.map(({ label, icon: Icon, link }) => (
        <Link href={link} key={label}
          className="w-full"
        >
          <motion.div
            className="flex items-center px-4 py-3 cursor-pointer hover:bg-gradient-to-r from-[#F4AE1A] to-[#F8781D] transition-colors group"
          >
            <Icon size={32} color={inactiveIconColor} className="min-w-[32px] group-hover:text-white" />
            <motion.span
              className="ml-4 text-gray-300 whitespace-nowrap overflow-hidden"
              initial={{ opacity: 0, width: 0 }}
              animate={{
                opacity: isSidebarExpanded ? 1 : 0,
                width: isSidebarExpanded ? "auto" : 0
              }}
              transition={{ duration: 0.2 }}
            >
              {label}
            </motion.span>
          </motion.div>
        </Link>
      ))}
    </motion.div>
  );
};

export default Sidebar;
