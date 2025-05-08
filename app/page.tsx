import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      {/* Hero Section */}
      <div className="w-full min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-b from-gray-900 to-black text-center">
        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-amber-500 mb-6">
          Solo Legend
        </h1>
        <h2 className="text-xl md:text-2xl font-semibold text-white mb-6">
          Your Hero&apos;s Journey to Peak Body & Mind
        </h2>
        <p className="max-w-2xl text-gray-300 mb-8">
          Transform your real-world fitness, health, and career goals into an
          epic RPG adventure. Level up in life as you defeat the Void of Complacency
          and become the legendary hero you were meant to be.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Link href="/register">Begin Your Journey</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Continue Quest</Link>
          </Button>
        </div>
        
        {/* Feature Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 max-w-6xl">
          <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-3">Epic Adventures</h3>
            <p className="text-gray-300">Complete quests, earn XP, and level up your character while achieving real-world goals.</p>
          </div>
          <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-3">Character Evolution</h3>
            <p className="text-gray-300">Choose your class, customize skills, and watch your avatar grow stronger with each achievement.</p>
          </div>
          <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-3">Defeat The Void</h3>
            <p className="text-gray-300">Overcome the Beast of Complacency through disciplined action and purposeful growth.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
