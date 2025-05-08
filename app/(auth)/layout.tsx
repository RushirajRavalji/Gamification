"use client";

import Link from "next/link";
import GlowingCursor from "@/app/components/GlowingCursor";
import AnimatedBackground from "@/app/components/AnimatedBackground";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black relative overflow-hidden">
      <GlowingCursor 
        size={35} 
        opacity={0.5} 
        color="rgba(236, 72, 153, 0.6)" 
        showTrail={true} 
        trailLength={5}
        pulseEffect={true}
        throttleMs={20}
      />
      <AnimatedBackground />
      <header className="py-6 px-4 flex justify-center relative z-10">
        <Link href="/" className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500">
          Solo Legend
        </Link>
      </header>
      <main className="relative z-10">{children}</main>
    </div>
  );
} 