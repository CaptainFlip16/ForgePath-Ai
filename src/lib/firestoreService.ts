import { 
  db, 
  auth,
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp 
} from "./firebase";
import { getDocFromServer, deleteDoc } from "firebase/firestore";
import { Roadmap } from "../types";
import { normalizeN8nRoadmap } from "../utils";

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validation function: test Firestore connection on boot
export async function testFirestoreConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.error("Please check your Firebase configuration: Client is offline.");
    }
  }
}

export interface OnboardingData {
  learningGoal: string;
  selectedSkills: string[];
  weeklyTime: string;
  learningStyle: string[];
  desiredOutcome: string;
  updatedAt?: any;
}

export interface ProgressData {
  completedSkills: string[];
  currentSkill: string;
  completionPercentage: number;
  updatedAt?: any;
}

// ---------------------------------------------------------
// Onboarding CRUD Service
// ---------------------------------------------------------
export async function saveOnboarding(uid: string, data: OnboardingData): Promise<void> {
  const path = `users/${uid}/onboarding/data`;
  try {
    const docRef = doc(db, "users", uid, "onboarding", "data");
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getOnboarding(uid: string): Promise<OnboardingData | null> {
  const path = `users/${uid}/onboarding/data`;
  try {
    const docRef = doc(db, "users", uid, "onboarding", "data");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as OnboardingData;
    }
    return null;
  } catch (err) {
    console.warn(`Could not read onboarding data for user ${uid}:`, err);
    return null;
  }
}

// ---------------------------------------------------------
// Roadmap CRUD Service
// ---------------------------------------------------------
export async function saveRoadmap(uid: string, roadmap: Roadmap): Promise<void> {
  const path = `users/${uid}/roadmap/data`;
  try {
    const docRef = doc(db, "users", uid, "roadmap", "data");
    await setDoc(docRef, {
      roadmapData: roadmap,
      generatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Remove redundant document created by n8n under `{uid}` if it exists
    try {
      const extraUidDocRef = doc(db, "users", uid, "roadmap", uid);
      await deleteDoc(extraUidDocRef);
    } catch (e) {
      // Ignore if document does not exist
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getRoadmap(uid: string): Promise<Roadmap | null> {
  try {
    // 1. Check if n8n saved document directly under user's UID: users/{uid}/roadmap/{uid}
    const docRefUid = doc(db, "users", uid, "roadmap", uid);
    const snapUid = await getDoc(docRefUid);
    if (snapUid.exists()) {
      const data = snapUid.data();
      const rawObj = data.roadmapData || data;
      let parsedRoadmap: Roadmap | null = null;
      if (rawObj && (rawObj.modules || rawObj.skills || rawObj.roadmapTitle)) {
        try {
          parsedRoadmap = normalizeN8nRoadmap(rawObj, rawObj.pathName || rawObj.roadmapTitle || "AI Path", "");
        } catch (e) {
          parsedRoadmap = rawObj as Roadmap;
        }
      }

      if (parsedRoadmap) {
        // Save to 'data' document and delete the '{uid}' document so only 'data' remains
        await saveRoadmap(uid, parsedRoadmap);
        try {
          await deleteDoc(docRefUid);
        } catch (delErr) {
          console.warn("Cleanup UID document error:", delErr);
        }
        return parsedRoadmap;
      }
    }

    // 2. Try standard path users/{uid}/roadmap/data
    const docRefData = doc(db, "users", uid, "roadmap", "data");
    const snapData = await getDoc(docRefData);
    if (snapData.exists()) {
      const data = snapData.data();
      const rawObj = data.roadmapData || data;
      if (rawObj && (rawObj.modules || rawObj.skills)) {
        try {
          return normalizeN8nRoadmap(rawObj, rawObj.pathName || rawObj.roadmapTitle || "AI Path", "");
        } catch (e) {
          return rawObj as Roadmap;
        }
      }
    }

    // 3. Try doc users/{uid}/roadmap/roadmap
    const docRefRoadmap = doc(db, "users", uid, "roadmap", "roadmap");
    const snapRoadmap = await getDoc(docRefRoadmap);
    if (snapRoadmap.exists()) {
      const data = snapRoadmap.data();
      const rawObj = data.roadmapData || data;
      if (rawObj && (rawObj.modules || rawObj.skills)) {
        let parsedRoadmap: Roadmap | null = null;
        try {
          parsedRoadmap = normalizeN8nRoadmap(rawObj, rawObj.pathName || rawObj.roadmapTitle || "AI Path", "");
        } catch (e) {
          parsedRoadmap = rawObj as Roadmap;
        }
        if (parsedRoadmap) {
          await saveRoadmap(uid, parsedRoadmap);
          try {
            await deleteDoc(docRefRoadmap);
          } catch (e) {}
          return parsedRoadmap;
        }
      }
    }

    return null;
  } catch (err) {
    console.warn(`Could not read roadmap data for user ${uid}:`, err);
    return null;
  }
}

export async function deleteRoadmap(uid: string): Promise<void> {
  const path = `users/${uid}/roadmap/data`;
  try {
    const docRef = doc(db, "users", uid, "roadmap", "data");
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ---------------------------------------------------------
// Progress CRUD Service
// ---------------------------------------------------------
export async function saveProgress(uid: string, progress: ProgressData): Promise<void> {
  const path = `users/${uid}/progress/data`;
  try {
    const docRef = doc(db, "users", uid, "progress", "data");
    await setDoc(docRef, {
      ...progress,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getProgress(uid: string): Promise<ProgressData | null> {
  const path = `users/${uid}/progress/data`;
  try {
    const docRef = doc(db, "users", uid, "progress", "data");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as ProgressData;
    }
    return null;
  } catch (err) {
    console.warn(`Could not read progress data for user ${uid}:`, err);
    return null;
  }
}
