"use client";

import AvatarTestComponent from "@/app/components/AvatarTestComponent";

export default function AvatarTestPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6 text-center relative">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
          Avatar System
        </span>
      </h1>
      
      <div className="max-w-4xl mx-auto">
        <AvatarTestComponent />
      </div>
    </div>
  );
} 