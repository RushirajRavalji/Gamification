"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/lib/firebase/auth";

export default function AboutPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">About Solo Legend</h1>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="progression">Progression</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Welcome to Solo Legend</CardTitle>
              <CardDescription>Transform your personal development into an epic adventure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Solo Legend transforms your personal development journey into an immersive RPG experience. 
                Complete real-life quests, develop character skills, earn XP, and level up as you progress 
                toward your fitness, health, and career goals.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-bold text-lg mb-2">Your Hero's Journey</h3>
                  <p className="text-gray-300">Starting as a Novice (Level 1), evolve through custom class paths as you complete quests and develop your real-world abilities.</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-bold text-lg mb-2">Real Growth, Real Rewards</h3>
                  <p className="text-gray-300">Every achievement in the real world is reflected in your character's stats, XP, and inventory.</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-bold text-lg mb-2">Build Your Legend</h3>
                  <p className="text-gray-300">Track your journey through the XP journal, visualize growth with streak counters, and watch your character evolve.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal pl-5 space-y-4">
                <li>
                  <strong>Create your character</strong> - Choose a class that reflects your primary focus: Warrior (body), Shadow (focus), or Sage (mind).
                </li>
                <li>
                  <strong>Accept quests</strong> - Track daily habits, complete special tasks, and take on epic challenges through the quest system.
                </li>
                <li>
                  <strong>Complete real-world tasks</strong> - Mark quests as complete when you finish the associated real-life activities.
                </li>
                <li>
                  <strong>Earn XP and level up</strong> - Gain experience points, advance your character's level, and develop your six core attributes.
                </li>
                <li>
                  <strong>Build your streak</strong> - Maintain consistency with your daily quests to increase your streak counter and earn bonuses.
                </li>
                <li>
                  <strong>Track your progress</strong> - Use the XP journal to reflect on your achievements and visualize your growth over time.
                </li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4 mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Core Features</CardTitle>
              <CardDescription>Everything you need to transform your goals into adventures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-700 rounded-lg p-4">
                  <h3 className="font-bold text-xl mb-2">Dashboard</h3>
                  <p className="text-gray-300 mb-3">Your central hub for tracking progress, viewing upcoming quests, and managing your adventure.</p>
                  <ul className="list-disc pl-5 text-sm text-gray-400">
                    <li>Overview of character stats and level</li>
                    <li>Current streak and XP progress</li>
                    <li>Today's quests and active quests</li>
                    <li>Quick access to all game features</li>
                  </ul>
                </div>

                <div className="border border-gray-700 rounded-lg p-4">
                  <h3 className="font-bold text-xl mb-2">Quest Log</h3>
                  <p className="text-gray-300 mb-3">Manage and track all your real-world tasks transformed into epic quests.</p>
                  <ul className="list-disc pl-5 text-sm text-gray-400">
                    <li>Daily quests for regular habits</li>
                    <li>Side quests for one-time tasks</li>
                    <li>Dungeons for multi-step projects</li>
                    <li>Boss fights for major challenges</li>
                    <li>Create custom quests for any goal</li>
                  </ul>
                </div>

                <div className="border border-gray-700 rounded-lg p-4">
                  <h3 className="font-bold text-xl mb-2">Character Profile</h3>
                  <p className="text-gray-300 mb-3">View and manage your hero's stats, appearance, and background story.</p>
                  <ul className="list-disc pl-5 text-sm text-gray-400">
                    <li>Six core attributes that reflect your real-world skills</li>
                    <li>Character class selection</li>
                    <li>Level progression and XP tracking</li>
                    <li>Current streak and achievements</li>
                  </ul>
                </div>

                <div className="border border-gray-700 rounded-lg p-4">
                  <h3 className="font-bold text-xl mb-2">Skill Tree</h3>
                  <p className="text-gray-300 mb-3">Develop specialized abilities that enhance your real-world capabilities.</p>
                  <ul className="list-disc pl-5 text-sm text-gray-400">
                    <li>Unlock new skills as you level up</li>
                    <li>Choose from different skill branches</li>
                    <li>Skills correspond to real-world abilities</li>
                    <li>Passive and active skill bonuses</li>
                  </ul>
                </div>

                <div className="border border-gray-700 rounded-lg p-4">
                  <h3 className="font-bold text-xl mb-2">Inventory</h3>
                  <p className="text-gray-300 mb-3">Collect and manage items that represent your real-world tools and achievements.</p>
                  <ul className="list-disc pl-5 text-sm text-gray-400">
                    <li>Gear that provides stat bonuses</li>
                    <li>Badges and trophies from achievements</li>
                    <li>Items earned through quest completion</li>
                    <li>Equipment slots for character customization</li>
                  </ul>
                </div>

                <div className="border border-gray-700 rounded-lg p-4">
                  <h3 className="font-bold text-xl mb-2">XP Journal</h3>
                  <p className="text-gray-300 mb-3">Track your journey and review your progress over time.</p>
                  <ul className="list-disc pl-5 text-sm text-gray-400">
                    <li>Chronological history of completed quests</li>
                    <li>XP gained and milestones reached</li>
                    <li>Reflection notes for personal insights</li>
                    <li>Visual progress tracking</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progression" className="space-y-4 mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Character Development System</CardTitle>
              <CardDescription>How your real-world efforts translate to in-game progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-bold text-xl mb-3">Core Stats</h3>
                <p className="mb-4">Your character has six primary attributes that reflect different aspects of your real-world development:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-900/30 p-4 rounded-lg">
                    <h4 className="font-bold">Strength</h4>
                    <p className="text-sm text-gray-300">Physical fitness, health, and vitality. Improved through exercise and physical activities.</p>
                  </div>
                  <div className="bg-blue-900/30 p-4 rounded-lg">
                    <h4 className="font-bold">Intelligence</h4>
                    <p className="text-sm text-gray-300">Knowledge, learning, and problem solving. Enhanced through study and intellectual pursuits.</p>
                  </div>
                  <div className="bg-purple-900/30 p-4 rounded-lg">
                    <h4 className="font-bold">Focus</h4>
                    <p className="text-sm text-gray-300">Concentration, mindfulness, and attention. Developed through meditation and deep work.</p>
                  </div>
                  <div className="bg-green-900/30 p-4 rounded-lg">
                    <h4 className="font-bold">Dexterity</h4>
                    <p className="text-sm text-gray-300">Skill, coordination, and craftsmanship. Refined through practice of technical skills.</p>
                  </div>
                  <div className="bg-yellow-900/30 p-4 rounded-lg">
                    <h4 className="font-bold">Willpower</h4>
                    <p className="text-sm text-gray-300">Discipline, habit formation, and motivation. Strengthened by consistency and overcoming challenges.</p>
                  </div>
                  <div className="bg-pink-900/30 p-4 rounded-lg">
                    <h4 className="font-bold">Influence</h4>
                    <p className="text-sm text-gray-300">Communication, leadership, and social ability. Developed through social activities and service.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-xl mb-3">Character Classes</h3>
                <p className="mb-3">Your character class reflects your primary focus area and provides bonuses to certain stats:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-red-900/30 p-4 rounded-lg">
                    <h4 className="font-bold text-red-400">Warrior</h4>
                    <p className="text-sm text-gray-300 mb-2">Masters of physical development with a focus on strength and health.</p>
                    <p className="text-xs text-gray-400">Primary stats: Strength, Willpower</p>
                  </div>
                  <div className="border border-purple-900/30 p-4 rounded-lg">
                    <h4 className="font-bold text-purple-400">Shadow</h4>
                    <p className="text-sm text-gray-300 mb-2">Specialists in focus and discipline who excel at deep work.</p>
                    <p className="text-xs text-gray-400">Primary stats: Focus, Dexterity</p>
                  </div>
                  <div className="border border-blue-900/30 p-4 rounded-lg">
                    <h4 className="font-bold text-blue-400">Sage</h4>
                    <p className="text-sm text-gray-300 mb-2">Intellectuals who prioritize learning and knowledge acquisition.</p>
                    <p className="text-xs text-gray-400">Primary stats: Intelligence, Influence</p>
                  </div>
                </div>
                
                <p className="mt-3 text-sm text-gray-400">As you level up, more advanced class options become available at level 15 and 40.</p>
              </div>

              <div>
                <h3 className="font-bold text-xl mb-3">Experience Points (XP)</h3>
                <p>You earn XP by completing quests:</p>
                <ul className="list-disc pl-5 space-y-2 mt-2">
                  <li><strong>Daily Quests:</strong> 30-50 XP</li>
                  <li><strong>Side Quests:</strong> 50-150 XP</li>
                  <li><strong>Dungeons:</strong> 200-500 XP (depending on complexity)</li>
                  <li><strong>Boss Fights:</strong> 500-1000 XP (major accomplishments)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-xl mb-3">Leveling System</h3>
                <p className="mb-3">As you accumulate XP, you'll level up your character:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Each level requires progressively more XP</li>
                  <li>Leveling up increases your core stats</li>
                  <li>Milestone levels unlock new class options and features</li>
                  <li>Higher levels provide greater rewards and challenges</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-xl mb-3">Streaks</h3>
                <p className="mb-3">Consistent daily activity builds your streak, which provides additional benefits:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>XP multipliers for maintaining streaks</li>
                  <li>Special rewards at streak milestones</li>
                  <li>Streak tracking to visualize your consistency</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4 mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Rewards and Motivation</CardTitle>
              <CardDescription>How Solo Legend keeps you engaged and motivated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-bold text-xl mb-3">Item System</h3>
                <p className="mb-4">Earn various items as you progress through your journey:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-700 p-4 rounded-lg">
                    <h4 className="font-bold flex items-center gap-2">
                      <span className="text-xl">⚔️</span> Weapons & Armor
                    </h4>
                    <p className="text-sm text-gray-300 mt-1">Equipment that provides stat bonuses to help you on your quests.</p>
                  </div>
                  <div className="border border-gray-700 p-4 rounded-lg">
                    <h4 className="font-bold flex items-center gap-2">
                      <span className="text-xl">📿</span> Accessories
                    </h4>
                    <p className="text-sm text-gray-300 mt-1">Special items that provide focused benefits for specific activities.</p>
                  </div>
                  <div className="border border-gray-700 p-4 rounded-lg">
                    <h4 className="font-bold flex items-center gap-2">
                      <span className="text-xl">🧪</span> Consumables
                    </h4>
                    <p className="text-sm text-gray-300 mt-1">One-time use items that can help with specific challenges.</p>
                  </div>
                  <div className="border border-gray-700 p-4 rounded-lg">
                    <h4 className="font-bold flex items-center gap-2">
                      <span className="text-xl">🏆</span> Achievements
                    </h4>
                    <p className="text-sm text-gray-300 mt-1">Special recognitions for reaching milestones in your journey.</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-xl mb-3">Rarity System</h3>
                <p className="mb-3">Items come in different tiers of rarity, reflecting the challenge of acquiring them:</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <div className="text-center p-2 bg-gray-700 rounded-lg">
                    <div className="font-bold">Common</div>
                    <div className="text-gray-400 text-sm">Basic items</div>
                  </div>
                  <div className="text-center p-2 bg-green-700/50 rounded-lg">
                    <div className="font-bold">Uncommon</div>
                    <div className="text-gray-300 text-sm">Above average</div>
                  </div>
                  <div className="text-center p-2 bg-blue-700/50 rounded-lg">
                    <div className="font-bold">Rare</div>
                    <div className="text-gray-300 text-sm">Significant challenge</div>
                  </div>
                  <div className="text-center p-2 bg-purple-700/50 rounded-lg">
                    <div className="font-bold">Epic</div>
                    <div className="text-gray-300 text-sm">Major achievements</div>
                  </div>
                  <div className="text-center p-2 bg-orange-700/50 rounded-lg">
                    <div className="font-bold">Legendary</div>
                    <div className="text-gray-300 text-sm">Extraordinary feats</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-xl mb-3">Achievement System</h3>
                <p className="mb-3">Solo Legend recognizes and celebrates your milestones:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Quest Achievements</strong> - Completing certain numbers or types of quests</li>
                  <li><strong>Streak Achievements</strong> - Maintaining consistent daily activity</li>
                  <li><strong>Stat Achievements</strong> - Reaching specific stat thresholds</li>
                  <li><strong>Level Achievements</strong> - Reaching important character level milestones</li>
                  <li><strong>Collection Achievements</strong> - Acquiring sets of inventory items</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-xl mb-3">Visual Progression</h3>
                <p className="mb-3">Track your growth visually through various indicators:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Stats Dashboard</strong> - See your current level, XP, and streak at a glance</li>
                  <li><strong>Character Profile</strong> - View detailed information about your character's development</li>
                  <li><strong>XP Journal</strong> - Review a chronological record of your accomplishments</li>
                  <li><strong>Inventory Display</strong> - Browse your collection of earned items and achievements</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="space-y-4 mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How is my progress tracked?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-300">
                      Progress is self-reported - you mark quests as complete when you finish the associated real-world tasks. 
                      The system awards XP based on the quest type and difficulty. For daily habits, streak counters automatically 
                      track your consistency. The platform uses a trust system, as the primary benefit is your own real-world growth.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>What happens if I miss a day?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-300">
                      If you miss completing your daily quests, your streak counter will reset. However, this is just part of the 
                      journey! You can always start building your streak again. The important thing is to get back on track and 
                      continue making progress toward your goals.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Can I customize my quests and goals?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-300">
                      Absolutely! Solo Legend is designed to be highly customizable. You can create custom quests that align with your 
                      specific goals and priorities. You can set quest difficulty, frequency, and rewards to match the real-world 
                      effort involved. This ensures the game adapts to your unique personal development journey.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>How do I choose the right character class?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-300">
                      Your character class should align with your primary goals and focus areas. The Warrior class focuses on physical development, 
                      the Shadow class emphasizes focus and discipline, and the Sage class centers on intellectual growth. Choose the one that 
                      best matches your current priorities, but don't worry - all classes can develop all stats.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>Is my data private and secure?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-300">
                      Yes, your data privacy is a priority. Solo Legend uses Firebase authentication and secure database storage. 
                      Your personal information and quest details are visible only to you. We don't share your data with third parties,
                      and you maintain full control over your account information.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6">
                  <AccordionTrigger>How does the leveling system work?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-300">
                      You earn XP by completing quests, with more challenging quests providing greater rewards. As you accumulate XP, 
                      you'll level up automatically. Each level requires progressively more XP, and reaching certain level milestones 
                      (like level 15 and 40) unlocks new character class options and features.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-7">
                  <AccordionTrigger>What if I want to track multiple goal areas?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-gray-300">
                      Solo Legend is designed to integrate all aspects of personal development into a single character journey. 
                      You can create quests for any area of life - fitness, learning, career, relationships, creative pursuits, etc. 
                      Your character's balanced growth across all stats reflects a holistic approach to self-improvement.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 