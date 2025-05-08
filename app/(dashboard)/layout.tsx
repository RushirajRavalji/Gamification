"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mock character data
  const characterData = {
    name: "HeroName",
    level: 5,
    xp: 750,
    xpToNextLevel: 1000,
    class: "Warrior",
    streakCount: 7
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Quest Log", path: "/dashboard/quests" },
    { name: "Character", path: "/dashboard/character" },
    { name: "Skill Tree", path: "/dashboard/skills" },
    { name: "Inventory", path: "/dashboard/inventory" },
    { name: "XP Journal", path: "/dashboard/journal" },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex md:w-64 flex-col bg-gray-800 border-r border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500">
            Solo Legend
          </Link>
        </div>
        
        {/* Character Info */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3 mb-3">
            <Avatar className="h-12 w-12 border-2 border-purple-500">
              <AvatarImage src="/avatar.png" />
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600">
                {characterData.name.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{characterData.name}</h3>
              <p className="text-sm text-gray-400">Lvl {characterData.level} {characterData.class}</p>
            </div>
          </div>
          
          <div className="mb-1 flex justify-between text-xs">
            <span>XP</span>
            <span>{characterData.xp} / {characterData.xpToNextLevel}</span>
          </div>
          <Progress value={(characterData.xp / characterData.xpToNextLevel) * 100} className="h-2 mb-3" />
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Streak: {characterData.streakCount} days</span>
            <span className="bg-amber-700 text-amber-200 text-xs px-2 py-1 rounded-full">🔥 {characterData.streakCount}</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-2">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link 
                  href={item.path} 
                  className={`block px-4 py-2 rounded-md transition ${pathname === item.path 
                    ? 'bg-purple-900 text-white' 
                    : 'text-gray-300 hover:bg-gray-700'}`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Logout button */}
        <div className="p-4 border-t border-gray-700">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">
              Return to Camp
            </Link>
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-800 border-b border-gray-700 z-10">
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500">
            Solo Legend
          </Link>
          <button 
            onClick={toggleMobileMenu} 
            className="text-gray-300 hover:text-white"
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
          </button>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="bg-gray-800 p-4 border-b border-gray-700">
            {/* Character Info */}
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="h-10 w-10 border-2 border-purple-500">
                <AvatarImage src="/avatar.png" />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600">
                  {characterData.name.substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{characterData.name}</h3>
                <p className="text-xs text-gray-400">Lvl {characterData.level} {characterData.class}</p>
              </div>
              <span className="ml-auto bg-amber-700 text-amber-200 text-xs px-2 py-1 rounded-full">🔥 {characterData.streakCount}</span>
            </div>
            
            <div className="mb-1 flex justify-between text-xs">
              <span>XP</span>
              <span>{characterData.xp} / {characterData.xpToNextLevel}</span>
            </div>
            <Progress value={(characterData.xp / characterData.xpToNextLevel) * 100} className="h-2 mb-4" />
            
            {/* Navigation */}
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    href={item.path} 
                    className={`block px-3 py-2 rounded-md transition ${pathname === item.path 
                      ? 'bg-purple-900 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link 
                  href="/login" 
                  className="block px-3 py-2 rounded-md transition text-gray-300 hover:bg-gray-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Return to Camp
                </Link>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-0 md:pt-0">
        <div className="md:p-6 p-4 mt-16 md:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
} 