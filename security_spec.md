# ForgePath AI Security Specification

## 1. Data Invariants
- **Identity Isolation**: A user with UID `X` can ONLY write, read, or delete documents under the path `/users/X/...`. They can never access `/users/Y/...`.
- **Verified Identity**: All writes must check `request.auth != null && request.auth.uid == uid`.
- **Immutable Timestamps**: Field properties representing historical creation points (`createdAt`) are immutable after initial document set.
- **Strict Size/Format Checking**: String fields must be bounded in length to prevent "Denial of Wallet" resource exhaustion.

---

## 2. The "Dirty Dozen" Payloads

Here are 12 specific payloads attempting to violate user data isolation or compromise state integrity, all of which must return `PERMISSION_DENIED`:

### Identity Spoofing Attacks
1. **Malicious Profile Write to Another User**: User A (uid: `user-A`) tries to set `/users/user-B` with their own profile.
2. **Onboarding Hijack**: User A tries to edit the onboarding answers at `/users/user-B/onboarding/data`.
3. **Roadmap Injection**: User A tries to overwrite the roadmap document of User B at `/users/user-B/roadmap/data`.
4. **Progress Alteration**: User A attempts to write a 100% completed progress map under `/users/user-B/progress/data`.

### State and Resource Attacks
5. **Denial of Wallet (Huge String Name)**: User A tries to write a 1MB string to their own `fullName` property.
6. **Denial of Wallet (Huge Array Items)**: User A tries to write an array containing 10,000 skills to `selectedSkills`.
7. **Privilege Escalation**: User A tries to add a `role: "admin"` property to their user profile.
8. **Malicious ID injection**: User A tries to set a subcollection document with an ID containing path-traversal strings like `../..`.

### Immutability & Temporal Violation Attacks
9. **Creation Time Spoof**: User A tries to overwrite `createdAt` to a date in the past, rather than the server timestamp.
10. **Last Login Spoof**: User A tries to update their `lastLoginAt` with a manual client timestamp.
11. **Malicious Onboarding Status Reversal**: User A tries to set `hasCompletedOnboarding` to `false` via a simple update without proper credentials.
12. **Bypassing the Security Schema**: User A tries to write a profile document to `users/{uid}` missing required properties (e.g. no `email` field).

---

## 3. The Test Runner Structure (`firestore.rules.test.ts`)

A test runner asserting complete isolation blocks:

```typescript
import { initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { setDoc, getDoc, doc } from "firebase/firestore";
import * as fs from "fs";

describe("ForgePath AI Firestore Security Rules Tests", () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "forgepath-ai-security-test",
      firestore: {
        rules: fs.readFileSync("firestore.rules", "utf8"),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it("blocks user-A from writing to user-B's profile", async () => {
    const maliciousDb = testEnv.authenticatedContext("user-A").firestore();
    const targetRef = doc(maliciousDb, "users/user-B");
    await expect(setDoc(targetRef, {
      uid: "user-B",
      fullName: "Hacker A",
      email: "hacker@domain.com",
    })).rejects.toThrow();
  });

  it("blocks unauthenticated user from writing profile", async () => {
    const anonDb = testEnv.unauthenticatedContext().firestore();
    const targetRef = doc(anonDb, "users/user-A");
    await expect(setDoc(targetRef, {
      uid: "user-A",
      fullName: "Anonymous",
      email: "anon@domain.com",
    })).rejects.toThrow();
  });
});
```
