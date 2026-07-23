import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  FirebaseUser
} from "./firebase";

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  createdAt: any;
  lastLoginAt: any;
  hasCompletedOnboarding?: boolean;
}

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  isSandbox: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  updateOnboardingStatus: (status: boolean) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Real active configuration mode only - Sandbox disabled
  const isSandbox = false;

  useEffect(() => {
    if (!auth || !db) {
      console.warn("[AuthContext] Firebase auth or firestore is not initialized. Check your environment variables.");
      setLoading(false);
      return;
    }

    // Subscribe to Firebase auth changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          let docSnap;
          try {
            docSnap = await getDoc(userDocRef);
          } catch (getErr: any) {
            console.warn("[AuthContext] Firestore fetch failed (client might be offline), falling back to local session state:", getErr);
            // Fallback to local profile when offline
            const savedRoadmap = localStorage.getItem(`forgepath_roadmap_${firebaseUser.uid}`);
            const fallbackProfile: UserProfile = {
              uid: firebaseUser.uid,
              fullName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Alex",
              email: firebaseUser.email || "",
              createdAt: new Date(),
              lastLoginAt: new Date(),
              hasCompletedOnboarding: !!savedRoadmap
            };
            setProfile(fallbackProfile);
            setLoading(false);
            return;
          }

          if (docSnap && docSnap.exists()) {
            const profileData = docSnap.data() as UserProfile;
            
            // Update last secure access timestamp in Firestore
            try {
              await updateDoc(userDocRef, {
                lastLoginAt: serverTimestamp()
              });
            } catch (updateErr) {
              console.warn("[AuthContext] Failed to update login timestamp (possibly offline):", updateErr);
            }

            setProfile({
              ...profileData,
              lastLoginAt: new Date()
            });
          } else {
            // Document does not exist yet (e.g. initial Google sign up)
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              fullName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Alex",
              email: firebaseUser.email || "",
              createdAt: new Date(),
              lastLoginAt: new Date(),
              hasCompletedOnboarding: false
            };
            try {
              await setDoc(userDocRef, {
                ...newProfile,
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp()
              });
            } catch (setErr) {
              console.warn("[AuthContext] Failed to create Firestore user document (possibly offline), continuing with local profile:", setErr);
            }
            setProfile(newProfile);
          }
        } catch (err: any) {
          console.error("[AuthContext] General error loading user profile:", err);
          const savedRoadmap = localStorage.getItem(`forgepath_roadmap_${firebaseUser.uid}`);
          const fallbackProfile: UserProfile = {
            uid: firebaseUser.uid,
            fullName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Alex",
            email: firebaseUser.email || "",
            createdAt: new Date(),
            lastLoginAt: new Date(),
            hasCompletedOnboarding: !!savedRoadmap
          };
          setProfile(fallbackProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setLoading(false);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const newProfile: UserProfile = {
        uid: firebaseUser.uid,
        fullName: fullName,
        email: email,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        hasCompletedOnboarding: false
      };

      // Create user profile document in Firestore database
      try {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        await setDoc(userDocRef, {
          ...newProfile,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp()
        });
      } catch (firestoreErr) {
        console.warn("[AuthContext] Firestore setDoc failed during sign up (possibly offline), continuing with local state:", firestoreErr);
      }

      setProfile(newProfile);
    } catch (err: any) {
      setLoading(false);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    if (!auth || !googleProvider) {
      throw new Error("Firebase Auth is not configured. Please enter your Firebase environment variables or use Email & Password Sign In.");
    }
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      
      const userDocRef = doc(db, "users", firebaseUser.uid);
      
      let docSnap;
      try {
        docSnap = await getDoc(userDocRef);
      } catch (getErr) {
        console.warn("[AuthContext] Firestore getDoc failed during Google Sign-In, utilizing local fallback:", getErr);
      }

      if (docSnap && docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;
        try {
          await updateDoc(userDocRef, {
            lastLoginAt: serverTimestamp()
          });
        } catch (updateErr) {
          console.warn("[AuthContext] Failed to update login timestamp (possibly offline):", updateErr);
        }
        setProfile({
          ...profileData,
          lastLoginAt: new Date()
        });
      } else {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          fullName: firebaseUser.displayName || "Google Developer",
          email: firebaseUser.email || "",
          createdAt: new Date(),
          lastLoginAt: new Date(),
          hasCompletedOnboarding: false
        };
        try {
          await setDoc(userDocRef, {
            ...newProfile,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp()
          });
        } catch (setErr) {
          console.warn("[AuthContext] Failed to create Google user profile (possibly offline):", setErr);
        }
        setProfile(newProfile);
      }
    } catch (err: any) {
      setLoading(false);
      throw err;
    }
  };

  const logOut = async () => {
    setError(null);
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      throw err;
    }
  };

  const updateOnboardingStatus = async (status: boolean) => {
    if (!profile) return;
    
    const updatedProfile = { ...profile, hasCompletedOnboarding: status };
    setProfile(updatedProfile);

    try {
      const userDocRef = doc(db, "users", profile.uid);
      await updateDoc(userDocRef, {
        hasCompletedOnboarding: status
      });
    } catch (err: any) {
      console.warn("[AuthContext] Error saving onboarding status to Firestore (possibly offline):", err);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isSandbox,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        logOut,
        updateOnboardingStatus,
        error,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
