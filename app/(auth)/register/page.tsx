"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { registerUser, getLocalAuthUser, useAuth } from "@/lib/firebase/auth";
import { db } from "@/lib/firebase/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const router = useRouter();
  const { user, initialized } = useAuth();

  // Check for existing authentication when component mounts
  useEffect(() => {
    // If Firebase auth is initialized and user is authenticated, redirect to dashboard
    if (initialized) {
      if (user) {
        console.log("User already authenticated, redirecting to dashboard");
        router.push("/dashboard");
      } else {
        // If Firebase doesn't have the user, check localStorage as fallback
        const localUser = getLocalAuthUser();
        if (localUser) {
          console.log("Found user in local storage, redirecting to dashboard");
          router.push("/dashboard");
        } else {
          // No authentication found, show registration form
          setIsLoading(false);
        }
      }
    }
  }, [user, initialized, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    
    // Firebase registration
    const result = await registerUser(formData.email, formData.password, formData.username);
    
    if (result.success && result.user) {
      try {
        // Initialize user data in Firestore
        await setDoc(doc(db, "users", result.user.uid), {
          username: formData.username,
          email: formData.email,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Initialize character data
        await setDoc(doc(db, "characters", result.user.uid), {
          userId: result.user.uid,
          name: formData.username,
          level: 1,
          xp: 0,
          xpToNextLevel: 100,
          totalXpEarned: 0,
          class: "Novice",
          stats: {
            strength: 5,
            intelligence: 5,
            focus: 5,
            dexterity: 5,
            willpower: 5,
            influence: 5
          },
          streakCount: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        router.push("/dashboard");
      } catch (firestoreError) {
        console.error("Error creating user document:", firestoreError);
        setError("Registration successful but failed to set up your profile. Please try again.");
        setIsLoading(false);
      }
    } else {
      setError(result.error || "Registration failed. Please try again.");
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading && initialized === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <div className="text-center">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-t-purple-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-900 to-black p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center text-white">Begin Your Journey</CardTitle>
          <CardDescription className="text-center text-gray-400">
            Create your hero profile and start your adventure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-200">Hero Name</label>
              <Input
                id="username"
                name="username"
                placeholder="Choose a legendary name"
                required
                value={formData.username}
                onChange={handleChange}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-200">Email</label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="hero@example.com"
                required
                value={formData.email}
                onChange={handleChange}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-200">Password</label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-200">Confirm Password</label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={isLoading}
            >
              {isLoading ? "Creating Hero..." : "Embark on Adventure"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300">
              Continue your quest
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 