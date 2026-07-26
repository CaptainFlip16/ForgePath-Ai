import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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

    // Process Google redirect result if coming back from redirect flow

    const pendingRedirect = typeof window !== "undefined" && sessionStorage.getItem("fp_google_redirect_pending") === "1";

    getRedirectResult(auth)
      .then(async (result) => {
        if (typeof window !== "undefined") sessionStorage.removeItem("fp_google_redirect_pending");

        if (result && result.user) {
          const firebaseUser = result.user;
          const userDocRef = doc(db, "users", firebaseUser.uid);
          let docSnap;
          try {
            docSnap = await getDoc(userDocRef);
          } catch (getErr) {
            console.warn("[AuthContext] Firestore getDoc failed after redirect:", getErr);
          }
          if (docSnap && docSnap.exists()) {
            const profileData = docSnap.data() as UserProfile;
            setProfile({ ...profileData, lastLoginAt: new Date() });
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
              await setDoc(userDocRef, { ...newProfile, createdAt: serverTimestamp(), lastLoginAt: serverTimestamp() });
            } catch (setErr) {
              console.warn("[AuthContext] Failed to save Google profile after redirect:", setErr);
            }
            setProfile(newProfile);
          }
        } else if (pendingRedirect) {
          // We came back from Google's redirect but got no user back - this is the
          // Chrome/Android storage-partitioning failure mode. Surface it instead of
          // silently dropping the user back on the sign-in screen.
          console.error("[AuthContext] Redirect completed but no credential was returned (likely blocked cross-site storage).");
          setError(
            "Google Sign-In didn't complete. This is usually caused by your browser blocking cross-site cookies/storage. Try enabling 'Allow all cookies' for this site in Chrome settings, or use Email & Password sign-in instead."
          );
        }
      })
      .catch((redirectErr: any) => {
        if (typeof window !== "undefined") sessionStorage.removeItem("fp_google_redirect_pending");
        console.error("[AuthContext] Redirect result processing failed:", redirectErr);
        setError(redirectErr?.message || "Google Sign-In failed to complete after redirect.");
      });


    // getRedirectResult(auth)
    //   .then(async (result) => {
    //     if (result && result.user) {
    //       const firebaseUser = result.user;
    //       const userDocRef = doc(db, "users", firebaseUser.uid);
    //       let docSnap;
    //       try {
    //         docSnap = await getDoc(userDocRef);
    //       } catch (getErr) {
    //         console.warn("[AuthContext] Firestore getDoc failed after redirect:", getErr);
    //       }
    //       if (docSnap && docSnap.exists()) {
    //         const profileData = docSnap.data() as UserProfile;
    //         setProfile({ ...profileData, lastLoginAt: new Date() });
    //       } else {
    //         const newProfile: UserProfile = {
    //           uid: firebaseUser.uid,
    //           fullName: firebaseUser.displayName || "Google Developer",
    //           email: firebaseUser.email || "",
    //           createdAt: new Date(),
    //           lastLoginAt: new Date(),
    //           hasCompletedOnboarding: false
    //         };
    //         try {
    //           await setDoc(userDocRef, { ...newProfile, createdAt: serverTimestamp(), lastLoginAt: serverTimestamp() });
    //         } catch (setErr) {
    //           console.warn("[AuthContext] Failed to save Google profile after redirect:", setErr);
    //         }
    //         setProfile(newProfile);
    //       }
    //     }
    //   })
    //   .catch((redirectErr) => {
    //     console.warn("[AuthContext] Redirect result processing:", redirectErr);
    //   });

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
              fullName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Learner",
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
              fullName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Learner",
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
            fullName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Learner",
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

  const inIframe = typeof window !== "undefined" && window.self !== window.top;
  const isMobile =
    typeof navigator !== "undefined" &&
    (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      // iPadOS 13+ Safari reports a desktop "Macintosh" UA - detect via touch points instead
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );

  // Inside a cross-origin/sandboxed iframe on a MOBILE device, neither popup nor a
  // top-level redirect can complete reliably: the popup gets silently opened-then-closed
  // by mobile tracking-prevention before the account picker can render (the exact bug
  // reported), and we cannot programmatically navigate window.top from inside a
  // cross-origin sandbox. Fail fast with actionable guidance instead of flashing a popup.
  if (isMobile && inIframe) {
    throw new Error(
      "Google Sign-In can't complete inside an embedded preview on mobile. Please tap 'Open in a new tab' below and sign in there."
    );
  }

  setLoading(true);
  try {
    // Mobile, top-level page (not embedded) -> redirect flow works reliably

    if (isMobile && !inIframe) {
      if (typeof window !== "undefined") sessionStorage.setItem("fp_google_redirect_pending", "1");
      await signInWithRedirect(auth, googleProvider);
      return;
    }

    // if (isMobile && !inIframe) {
    //   await signInWithRedirect(auth, googleProvider);
    //   return;
    // }

    // Desktop (iframe or not) -> popup flow, unchanged
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      const userDocRef = doc(db, "users", firebaseUser.uid);
      let docSnap;
      try {
        docSnap = await getDoc(userDocRef);
      } catch (getErr) {
        console.warn("[AuthContext] Firestore getDoc failed during Google Sign-In:", getErr);
      }

      if (docSnap && docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;
        try {
          await updateDoc(userDocRef, { lastLoginAt: serverTimestamp() });
        } catch (e) {}
        setProfile({ ...profileData, lastLoginAt: new Date() });
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
          await setDoc(userDocRef, { ...newProfile, createdAt: serverTimestamp(), lastLoginAt: serverTimestamp() });
        } catch (e) {}
        setProfile(newProfile);
      }
    } catch (popupErr: any) {
      console.warn("[AuthContext] Google popup failed:", popupErr);
      if (
        popupErr.code === "auth/popup-blocked" ||
        popupErr.code === "auth/popup-closed-by-user" ||
        popupErr.code === "auth/cancelled-popup-request" ||
        popupErr.message?.includes("popup")
      ) {
        throw new Error("Google Sign-In popup was blocked or closed. Please allow pop-ups for this site, or click the 'Open in a new tab' button at the top right of your browser/editor to open the site directly, and try again.");
      }
      throw popupErr;
    }
  } catch (err: any) {
    setLoading(false);
    throw err;
  }
};

  // const signInWithGoogle = async () => {
  //   setError(null);
  //   if (!auth || !googleProvider) {
  //     throw new Error("Firebase Auth is not configured. Please enter your Firebase environment variables or use Email & Password Sign In.");
  //   }
  //   setLoading(true);
  //   try {
  //     const isMobile = typeof navigator !== "undefined" && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  //     const inIframe = typeof window !== "undefined" && window.self !== window.top;

  //     if (isMobile && !inIframe) {
  //       await signInWithRedirect(auth, googleProvider);
  //       return;
  //     }

  //     try {
  //       const result = await signInWithPopup(auth, googleProvider);
  //       const firebaseUser = result.user;
        
  //       const userDocRef = doc(db, "users", firebaseUser.uid);
  //       let docSnap;
  //       try {
  //         docSnap = await getDoc(userDocRef);
  //       } catch (getErr) {
  //         console.warn("[AuthContext] Firestore getDoc failed during Google Sign-In:", getErr);
  //       }

  //       if (docSnap && docSnap.exists()) {
  //         const profileData = docSnap.data() as UserProfile;
  //         try {
  //           await updateDoc(userDocRef, { lastLoginAt: serverTimestamp() });
  //         } catch (e) {}
  //         setProfile({ ...profileData, lastLoginAt: new Date() });
  //       } else {
  //         const newProfile: UserProfile = {
  //           uid: firebaseUser.uid,
  //           fullName: firebaseUser.displayName || "Google Developer",
  //           email: firebaseUser.email || "",
  //           createdAt: new Date(),
  //           lastLoginAt: new Date(),
  //           hasCompletedOnboarding: false
  //         };
  //         try {
  //           await setDoc(userDocRef, { ...newProfile, createdAt: serverTimestamp(), lastLoginAt: serverTimestamp() });
  //         } catch (e) {}
  //         setProfile(newProfile);
  //       }
  //     } catch (popupErr: any) {
  //       console.warn("[AuthContext] Google popup failed:", popupErr);
  //       if (
  //         popupErr.code === "auth/popup-blocked" ||
  //         popupErr.code === "auth/popup-closed-by-user" ||
  //         popupErr.code === "auth/cancelled-popup-request" ||
  //         popupErr.message?.includes("popup")
  //       ) {
  //         throw new Error("Google Sign-In popup was blocked or closed. Please allow pop-ups for this site, or click the 'Open in a new tab' button at the top right of your browser/editor to open the site directly, and try again.");
  //       }
  //       throw popupErr;
  //     }
  //   } catch (err: any) {
  //     setLoading(false);
  //     throw err;
  //   }
  // };

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
    const targetUid = profile?.uid || user?.uid;
    if (!targetUid) return;
    
    if (profile) {
      setProfile({ ...profile, hasCompletedOnboarding: status });
    }

    try {
      const userDocRef = doc(db, "users", targetUid);
      await setDoc(userDocRef, {
        hasCompletedOnboarding: status
      }, { merge: true });
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
