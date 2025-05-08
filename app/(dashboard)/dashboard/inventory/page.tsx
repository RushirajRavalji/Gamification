"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-hot-toast";
import { useAuth } from "@/lib/firebase/auth";
import { useCharacter } from "@/lib/hooks/useCharacter";
import { db } from "@/lib/firebase/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { InventoryItem, ItemType, ItemRarity } from "@/lib/types";

// Default items to show for new users - will be replaced with character inventory
const defaultItems: InventoryItem[] = [
  {
    id: "starter-gear",
    name: "Novice's Journal",
    description: "A blank journal to record your adventure",
    type: "Accessory",
    rarity: "Common",
    statBoost: { focus: 1 },
    equipped: false,
    imageUrl: "📓",
    acquiredAt: new Date()
  }
];

export default function InventoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { character, isLoading: characterLoading } = useCharacter();
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isUpdating, setIsUpdating] = useState(false);
  
  const isLoading = authLoading || characterLoading;
  
  useEffect(() => {
    if (character) {
      if (character.inventory && character.inventory.length > 0) {
        // Format dates properly
        const formattedInventory = character.inventory.map(item => ({
          ...item,
          acquiredAt: item.acquiredAt instanceof Date ? item.acquiredAt : new Date(item.acquiredAt)
        }));
        
        setItems(formattedInventory);
      } else {
        // New character - show default starter items
        setItems(defaultItems);
      }
    }
  }, [character]);
  
  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(item);
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSelectedItem(null);
  };
  
  const filteredItems = () => {
    switch (activeTab) {
      case "equipped":
        return items.filter(item => item.equipped);
      case "accessories":
        return items.filter(item => item.type === "Accessory");
      case "consumables":
        return items.filter(item => item.type === "Consumable");
      case "achievements":
        return items.filter(item => item.type === "Badge" || item.type === "Trophy");
      default:
        return items;
    }
  };
  
  const getRarityColor = (rarity: ItemRarity) => {
    switch (rarity) {
      case "Common": return "bg-gray-500";
      case "Uncommon": return "bg-green-600";
      case "Rare": return "bg-blue-600";
      case "Epic": return "bg-purple-600";
      case "Legendary": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };
  
  const getTypeIcon = (type: ItemType) => {
    switch (type) {
      case "Weapon": return "⚔️";
      case "Armor": return "🛡️";
      case "Accessory": return "📿";
      case "Consumable": return "🧪";
      case "Badge": return "🏅";
      case "Trophy": return "🏆";
      default: return "📦";
    }
  };
  
  const toggleEquipItem = async () => {
    if (!selectedItem || !character || isUpdating) return;
    
    setIsUpdating(true);
    
    try {
      // Update item in state
      const updatedItems = items.map(item => {
        if (item.id === selectedItem.id) {
          return { ...item, equipped: !item.equipped };
        }
        
        // If equipping and there's an item limit, unequip another item of the same type
        if (
          selectedItem.type !== "Consumable" && 
          selectedItem.type !== "Badge" && 
          selectedItem.type !== "Trophy" && 
          !selectedItem.equipped && 
          item.type === selectedItem.type && 
          item.equipped
        ) {
          return { ...item, equipped: false };
        }
        
        return item;
      });
      
      setItems(updatedItems);
      
      // Update the selected item reference
      const updatedSelectedItem = { ...selectedItem, equipped: !selectedItem.equipped };
      setSelectedItem(updatedSelectedItem);
      
      // Update character in Firebase
      const characterDocRef = doc(db, 'users', user!.uid, 'character', character.id);
      
      await updateDoc(characterDocRef, {
        'inventory': updatedItems,
        'updatedAt': serverTimestamp()
      });
      
      // Update character stats based on equipped items
      const equippedItems = updatedItems.filter(item => item.equipped);
      
      // Calculate stat boosts from all equipped items
      const statBoosts: Record<string, number> = {};
      
      equippedItems.forEach(item => {
        if (item.statBoost) {
          Object.entries(item.statBoost).forEach(([stat, value]) => {
            statBoosts[stat] = (statBoosts[stat] || 0) + (value as number);
          });
        }
      });
      
      // We don't need to update character stats here since that's handled
      // by the useCharacter hook when inventory changes
      
      toast.success(selectedItem.equipped ? `${selectedItem.name} unequipped` : `${selectedItem.name} equipped`);
    } catch (error) {
      console.error("Error updating inventory:", error);
      toast.error("Failed to update inventory");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const useConsumable = async () => {
    if (!selectedItem || !character || isUpdating || selectedItem.type !== "Consumable") return;
    
    setIsUpdating(true);
    
    try {
      // Remove item from inventory
      const updatedItems = items.filter(item => item.id !== selectedItem.id);
      setItems(updatedItems);
      setSelectedItem(null);
      
      // Update character in Firebase
      const characterDocRef = doc(db, 'users', user!.uid, 'character', character.id);
      
      await updateDoc(characterDocRef, {
        'inventory': updatedItems,
        'updatedAt': serverTimestamp()
      });
      
      // Apply temporary stat boost or effect (would be implemented in a real app)
      toast.success(`Used ${selectedItem.name}`);
    } catch (error) {
      console.error("Error using consumable:", error);
      toast.error("Failed to use item");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const renderItem = (item: InventoryItem) => {
    return (
      <div 
        key={item.id}
        className={`p-4 rounded-lg cursor-pointer transition-all border border-gray-700
          ${item.equipped ? 'bg-gray-700' : 'bg-gray-800'} 
          hover:bg-gray-600
          ${selectedItem?.id === item.id ? 'ring-2 ring-purple-500' : ''}
        `}
        onClick={() => handleItemClick(item)}
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-md bg-gray-600 flex items-center justify-center text-2xl">
            {item.imageUrl || getTypeIcon(item.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{item.name}</h3>
              {item.equipped && <Badge variant="outline" className="text-xs">Equipped</Badge>}
            </div>
            <div className="flex gap-2 mt-1">
              <Badge className={`text-xs ${getRarityColor(item.rarity)}`}>
                {item.rarity}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {item.type}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  const calculateTotalStatBoosts = () => {
    const equippedItems = items.filter(item => item.equipped);
    const totalBoosts: Record<string, number> = {};
    
    equippedItems.forEach(item => {
      if (item.statBoost) {
        Object.entries(item.statBoost).forEach(([stat, value]) => {
          totalBoosts[stat] = (totalBoosts[stat] || 0) + (value as number);
        });
      }
    });
    
    return Object.values(totalBoosts).reduce((sum, value) => sum + value, 0);
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl mb-4">Please log in to view your inventory</h1>
        <Button asChild>
          <Link href="/login">Log In</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <div>
          <Button className="mr-2" variant="outline">Sort Items</Button>
          <Button>Shop</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
                <div className="flex justify-between items-center">
                  <CardTitle>Items</CardTitle>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="equipped">Equipped</TabsTrigger>
                    <TabsTrigger value="accessories">Accessories</TabsTrigger>
                    <TabsTrigger value="consumables">Consumables</TabsTrigger>
                    <TabsTrigger value="achievements">Achievements</TabsTrigger>
                  </TabsList>
                </div>
                <CardDescription>Your collected gear and trophies</CardDescription>
              </Tabs>
            </CardHeader>
            <CardContent>
              {filteredItems().length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>You don't have any {activeTab !== 'all' ? activeTab : ''} items yet.</p>
                  <p className="mt-2">Complete quests to earn rewards!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  {filteredItems().map(item => renderItem(item))}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t border-gray-700 pt-4">
              <div className="flex justify-between w-full text-sm text-gray-400">
                <span>Items: {items.length}/50</span>
                <span>Equipped: {items.filter(i => i.equipped).length}/8</span>
              </div>
            </CardFooter>
          </Card>
        </div>
        
        <div>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedItem ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-md bg-gray-600 flex items-center justify-center text-3xl">
                      {selectedItem.imageUrl || getTypeIcon(selectedItem.type)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{selectedItem.name}</h2>
                      <div className="flex gap-2 mt-1">
                        <Badge className={`${getRarityColor(selectedItem.rarity)}`}>
                          {selectedItem.rarity}
                        </Badge>
                        <Badge variant="outline">
                          {selectedItem.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-400">{selectedItem.description}</p>
                  
                  {selectedItem.statBoost && Object.keys(selectedItem.statBoost).length > 0 && (
                    <div className="bg-gray-700 p-3 rounded-lg">
                      <h3 className="text-sm font-medium mb-2">Stat Boosts</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(selectedItem.statBoost).map(([stat, value]) => (
                          <div key={stat} className="flex justify-between">
                            <span className="capitalize">{stat}</span>
                            <span className="text-green-400">+{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-400">
                    Acquired: {selectedItem.acquiredAt.toLocaleDateString()}
                  </div>
                  
                  <div className="pt-2">
                    {selectedItem.equipped ? (
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={toggleEquipItem}
                        disabled={isUpdating}
                      >
                        {isUpdating ? "Updating..." : "Unequip"}
                      </Button>
                    ) : (
                      ["Weapon", "Armor", "Accessory"].includes(selectedItem.type) ? (
                        <Button 
                          className="w-full" 
                          onClick={toggleEquipItem}
                          disabled={isUpdating}
                        >
                          {isUpdating ? "Updating..." : "Equip"}
                        </Button>
                      ) : selectedItem.type === "Consumable" ? (
                        <Button 
                          className="w-full" 
                          onClick={useConsumable}
                          disabled={isUpdating}
                        >
                          {isUpdating ? "Using..." : "Use"}
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full" disabled>
                          {selectedItem.type === "Badge" || selectedItem.type === "Trophy" 
                            ? "Achievement" 
                            : "View"}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-400 py-10">
                  Select an item to view details
                </p>
              )}
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 mt-4">
            <CardHeader>
              <CardTitle>Stats Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Items</span>
                  <span>{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Equipped</span>
                  <span>{items.filter(i => i.equipped).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rare+</span>
                  <span>{items.filter(i => ['Rare', 'Epic', 'Legendary'].includes(i.rarity)).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stat Bonuses</span>
                  <span className="text-green-400">+{calculateTotalStatBoosts()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 