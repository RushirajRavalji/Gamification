"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { loginUser, getLocalAuthUser, useAuth } from "@/lib/firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState("");
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
          // No authentication found, show login form
          setIsLoading(false);
        }
      }
    }
  }, [user, initialized, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // Firebase authentication
    const result = await loginUser(email, password);
    
    if (result.success) {
      router.push("/dashboard");
    } else {
      setError(result.error || "Failed to login. Please try again.");
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
          <CardTitle className="text-3xl font-bold text-center text-white">Continue Your Quest</CardTitle>
          <CardDescription className="text-center text-gray-400">
            Enter your credentials to resume your hero&apos;s journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-200">Email</label>
              <Input
                id="email"
                type="email"
                placeholder="hero@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-gray-200">Password</label>
                <Link href="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-700 text-white border-gray-600"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Continue Adventure"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-gray-400">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-purple-400 hover:text-purple-300">
              Begin your journey
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 