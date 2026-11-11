#!/usr/bin/env node
// Seed fictitious C2 actors only in local Firebase Auth + Firestore emulators.
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const expected = {
  GCLOUD_PROJECT: "demo-motuka-c2",
  GOOGLE_CLOUD_PROJECT: "demo-motuka-c2",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
};
for (const [key, value] of Object.entries(expected)) {
  if (process.env[key] !== value) {
    console.error(`REFUSED: ${key} must equal ${value}; never seed real Firebase.`);
    process.exit(2);
  }
}
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("REFUSED: production-capable credentials are not permitted.");
  process.exit(2);
}
const app = initializeApp({ projectId: expected.GCLOUD_PROJECT });
const auth = getAuth(app);
const db = getFirestore(app);
const actors = [
  ["c2-test-admin", "admin"],
  ["c2-test-manager", "manager"],
  ["c2-test-user", "user"],
  ["c2-test-candidate", "user"],
  ["c2-test-blocked", "admin"],
];
for (const [uid, role] of actors) {
  try {
    await auth.createUser({ uid, email: `${uid}@example.test`, password: "LocalDemoOnly-123456" });
  } catch (error) {
    if (error.code !== "auth/uid-already-exists") throw error;
  }
  await db.collection("users").doc(uid).set({
    role,
    status: uid === "c2-test-blocked" ? "blocked" : "active",
    isPartner: false,
    isTestAccount: true,
  });
}
await db.collection("partnerApplications").doc("c2-test-candidate").set({
  userId: "c2-test-candidate",
  fullName: "Candidate C2 (fictional)",
  city: "Demo",
  phone: "000000000",
  status: "pending",
  decisionVersion: 0,
  termsVersion: "1.0",
  termsAcceptedAt: new Date("2026-11-04T09:15:00.000Z"),
  termsDocumentSha256: "a".repeat(64),
  termsAcceptanceMethod: "authenticated_checkbox",
  createdAt: new Date(),
  isTestApplication: true,
});
// Historical records deliberately have no invented consent or profile.
for (const [uid, name, consent] of [
  ["c2-test-legacy", "Legacy C2 (fictional)", {}],
  ["c2-test-partial", "Partial C2 (fictional)", { termsDocumentSha256: "b".repeat(64) }],
]) {
  await db.collection("partnerApplications").doc(uid).set({
    userId: uid, fullName: name, city: "Demo", phone: "000000000",
    status: "pending", createdAt: new Date("2026-10-01T00:00:00Z"),
    motivation: "Historical motivation", experience: "Historical experience",
    isTestApplication: true, ...consent,
  });
}
for (const [uid, role] of actors) {
  const [account, profile] = await Promise.all([
    auth.getUser(uid),
    db.collection("users").doc(uid).get(),
  ]);
  if (account.uid !== uid || !profile.exists || profile.data().role !== role ||
      profile.data().isPartner !== false ||
      profile.data().status !== (uid === "c2-test-blocked" ? "blocked" : "active")) {
    throw new Error(`Seed verification failed for fictional actor ${uid}`);
  }
}
const seededApplication = await db.collection("partnerApplications").doc("c2-test-candidate").get();
if (!seededApplication.exists || seededApplication.data().status !== "pending" ||
    seededApplication.data().decisionVersion !== 0 ||
    seededApplication.data().isTestApplication !== true) {
  throw new Error("Seed verification failed for fictional pending application");
}
console.log("Seeded 5 fictional Auth users and 3 pending applications in local emulators only.");
console.log("Use Firebase Auth Emulator REST signInWithPassword to obtain ID tokens; never use real tokens.");
