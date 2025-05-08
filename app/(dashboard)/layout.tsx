"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth, logoutUser, getLocalAuthUser } from "@/lib/firebase/auth";
import { useCharacter } from "@/lib/hooks/useCharacter";
import CharacterAvatar from "@/app/components/CharacterAvatar";
import AnimatedBackground from "@/app/components/AnimatedBackground";
import GlowingCursor from "@/app/components/GlowingCursor";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { character, isLoading: characterLoading } = useCharacter();
  const router = useRouter();
  
  const isLoading = authLoading || characterLoading;

  // Use useEffect for navigation instead of doing it during render
  useEffect(() => {
    if (!isLoading && !user) {
      // Check if we have user data in local storage as a fallback
      const localUser = getLocalAuthUser();
      if (!localUser) {
        // No user in Firebase auth or local storage, redirect to login
        router.push("/login");
      }
    }
  }, [user, isLoading, router]);
  
  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      router.push("/login");
    }
  };

  const navItems = [
    { 
      name: "Dashboard", 
      path: "/dashboard",
      icon: "🏠"
    },
    { 
      name: "Quest Log", 
      path: "/dashboard/quests",
      icon: "📜"
    },
    { 
      name: "Character", 
      path: "/dashboard/character",
      icon: "👤"
    },
    { 
      name: "Skill Tree", 
      path: "/dashboard/skills",
      icon: "🌳"
    },
    { 
      name: "Inventory", 
      path: "/dashboard/inventory",
      icon: "🎒"
    },
    { 
      name: "XP Journal", 
      path: "/dashboard/journal",
      icon: "📖"
    },
    { 
      name: "About", 
      path: "/dashboard/about",
      icon: "ℹ️"
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  // Show loading state while checking authentication and loading character
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-bounce-slow mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse-slow flex items-center justify-center text-white text-3xl">
              🎮
            </div>
          </div>
          <div className="text-white text-xl">Loading your adventure...</div>
          <div className="mt-4 w-48 h-2 bg-gray-800 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-shine"></div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated, the useEffect will handle redirection
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white relative overflow-hidden">
      <GlowingCursor 
        size={35} 
        opacity={0.5} 
        color="rgba(147, 51, 234, 0.6)" 
        showTrail={true} 
        trailLength={5}
        pulseEffect={true}
        throttleMs={20} 
      />
      {/* Animated background */}
      <AnimatedBackground />
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-72 flex-col bg-gray-800/80 backdrop-blur-sm border-r border-gray-700 relative overflow-hidden rounded-r-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(120,40,200,0.15),transparent_70%)] pointer-events-none"></div>
        <div className="p-6 border-b border-gray-700 relative z-10">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Link href="/dashboard" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 hover:animate-pulse-slow transition-all">
              Solo Legend
            </Link>
          </motion.div>
        </div>
        
        {/* Character Info */}
        <div className="p-6 border-b border-gray-700 relative z-10">
          {character && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <motion.div whileHover={{ scale: 1.1 }} transition={{ duration: 0.2 }}>
                  <CharacterAvatar 
                    avatarId={character.avatarId}
                    name={character.name}
                    className="h-12 w-12 animate-float rounded-full"
                  />
                </motion.div>
                <div>
                  <h3 className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300">
                    {character.name}
                  </h3>
                  <p className="text-sm text-gray-400">Lvl {character.level} {character.class}</p>
                </div>
              </div>
              
              <div className="mb-1 flex justify-between text-xs">
                <span>XP</span>
                <span>{character.xp} / {character.xpToNextLevel}</span>
              </div>
              <Progress 
                value={(character.xp / character.xpToNextLevel) * 100} 
                className="h-2 mb-3 bg-gray-700"
                indicatorClassName="bg-gradient-to-r from-purple-600 to-pink-600 animate-pulse-slow" 
              />
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Total XP: {character.totalXpEarned || 0}</span>
                <motion.span 
                  whileHover={{ scale: 1.1 }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-2 py-1 rounded-full shadow-lg shadow-purple-900/30 animate-pulse-slow"
                >
                  🔥 {character.streakCount}
                </motion.span>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 relative z-10">
          <motion.ul 
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {navItems.map((item, index) => (
              <motion.li 
                key={item.path}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
              >
                <Link 
                  href={item.path} 
                  className={`flex items-center px-5 py-3 rounded-lg transition-all ${pathname === item.path 
                    ? 'bg-gradient-to-r from-purple-800 to-pink-900 text-white shadow-md shadow-purple-900/20 animate-pulse-slow' 
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:translate-x-1'}`}
                >
                  <span className="mr-2 text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                  {pathname === item.path && (
                    <span className="ml-2 flex h-2 w-2 relative">
                      <span className="animate-ping absolute h-2 w-2 rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative rounded-full h-2 w-2 bg-purple-300"></span>
                    </span>
                  )}
                </Link>
              </motion.li>
            ))}
          </motion.ul>
        </nav>
        
        {/* Logout button */}
        <div className="p-6 border-t border-gray-700 relative z-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Button 
              variant="outline" 
              className="w-full border-purple-500/30 hover:bg-purple-950/30 hover:text-purple-300 group transition-all rounded-lg"
              onClick={handleLogout}
            >
              <span className="mr-2 group-hover:rotate-12 transition-transform duration-300">🚪</span>
              Log Out
            </Button>
          </motion.div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-900/95 backdrop-blur-lg border-b border-purple-900/30 z-50">
        <div className="flex items-center justify-between p-4">
          <Link href="/dashboard" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500">
            Solo Legend
          </Link>
          <motion.button 
            onClick={toggleMobileMenu} 
            className="text-gray-300 hover:text-white bg-gray-800/80 rounded-full p-1.5"
            whileTap={{ scale: 0.9 }}
          >
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </motion.button>
        </div>
        
        {/* Mobile Menu with AnimatePresence */}
        <AnimatePresence>
          {isMobileMenuOpen && character && (
            <motion.div 
              className="absolute top-full left-0 right-0 bg-gradient-to-b from-gray-900 to-purple-900 backdrop-blur-lg p-4 pb-6 border-b border-purple-900/30 shadow-lg shadow-purple-900/20 z-50"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ 
                duration: 0.3,
                ease: "easeInOut" 
              }}
            >
              {/* Character Info */}
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex items-center space-x-3 mb-4 bg-gray-800/40 p-3 rounded-lg border border-purple-900/20"
              >
                <CharacterAvatar 
                  avatarId={character?.avatarId}
                  name={character?.name || "Hero"}
                  className="h-12 w-12"
                />
                <div>
                  <h3 className="font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300">
                    {character?.name || "Hero"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-purple-900/80 rounded-full text-white">Level {character?.level || 1}</span>
                    <span className="text-xs text-gray-400">{character?.class || "Novice"}</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="space-y-4 mb-4"
              >
                <div className="bg-gray-800/40 p-3 rounded-lg border border-purple-900/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">⚡ XP Progress</span>
                    <span className="text-sm">{character?.xp || 0} / {character?.xpToNextLevel || 100}</span>
                  </div>
                  <Progress 
                    value={((character?.xp || 0) / (character?.xpToNextLevel || 100)) * 100} 
                    className="h-2 bg-gray-700"
                    indicatorClassName="bg-gradient-to-r from-purple-600 to-pink-600"
                  />
                </div>
                
                <div className="bg-gray-800/40 p-3 rounded-lg border border-purple-900/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">💫 Total XP Earned</span>
                    <span className="text-sm">{character?.totalXpEarned || 0}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Lifetime XP accumulation
                  </p>
                </div>
                
                <div className="bg-gray-800/40 p-3 rounded-lg border border-purple-900/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">🔥 Current Streak</span>
                    <span className="text-sm">{character?.streakCount || 0} Days</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {character?.streakCount ? "Keep it going!" : "Complete a daily quest to start a streak."}
                  </p>
                </div>
              </motion.div>
              
              {/* Navigation */}
              <motion.div
                className="bg-gray-800/40 rounded-lg border border-purple-900/20 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <ul className="divide-y divide-purple-900/10">
                  {navItems.map((item, index) => (
                    <motion.li 
                      key={item.path}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 + (0.05 * index), duration: 0.3 }}
                    >
                      <Link 
                        href={item.path} 
                        className={`flex items-center px-4 py-3 transition-all ${pathname === item.path 
                          ? 'bg-gradient-to-r from-purple-800/80 to-pink-900/80 text-white' 
                          : 'text-gray-300 hover:bg-gray-700/30 hover:text-white'}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        <span>{item.name}</span>
                      </Link>
                    </motion.li>
                  ))}
                  <motion.li
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + (0.05 * navItems.length), duration: 0.3 }}
                  >
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left flex items-center px-4 py-3 text-gray-300 hover:bg-gray-700/30 hover:text-white transition-all"
                    >
                      <span className="mr-3 text-lg">🚪</span>
                      Log Out
                    </button>
                  </motion.li>
                </ul>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-0 md:pt-0 relative">
        <div className="md:p-10 p-4 pb-24 mt-16 md:mt-0 relative z-0 max-w-6xl mx-auto pointer-events-auto">
          {children}
        </div>
      </main>
      
      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 pointer-events-auto"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
} 