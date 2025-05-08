import { useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from './firebase';

// Custom hook for auth state
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      setInitialized(true);
      
      if (user) {
        // User is logged in - we can add additional actions here if needed
        console.log('User is logged in:', user.email);
        // Save minimal auth data to localStorage as a backup
        localStorage.setItem('authUser', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }));
      } else {
        // User is signed out
        localStorage.removeItem('authUser');
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, initialized };
}

// Register a new user
export async function registerUser(email: string, password: string, username: string) {
  try {
    // Set persistence to LOCAL for this session
    await setPersistence(auth, browserLocalPersistence);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update the user's display name
    await updateProfile(user, {
      displayName: username
    });
    
    return { success: true, user };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'An error occurred during registration' 
    };
  }
}

// Login existing user
export async function loginUser(email: string, password: string) {
  try {
    // Set persistence to LOCAL for this session
    await setPersistence(auth, browserLocalPersistence);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Save minimal auth data to localStorage as a backup
    localStorage.setItem('authUser', JSON.stringify({
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      displayName: userCredential.user.displayName
    }));
    
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'An error occurred during login' 
    };
  }
}

// Check if user has local auth data
export function getLocalAuthUser() {
  if (typeof window !== 'undefined') {
    const authUser = localStorage.getItem('authUser');
    return authUser ? JSON.parse(authUser) : null;
  }
  return null;
}

// Logout user
export async function logoutUser() {
  try {
    await signOut(auth);
    // Clear any local auth data
    localStorage.removeItem('authUser');
    return { success: true };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message || 'An error occurred during logout' 
    };
  }
} 