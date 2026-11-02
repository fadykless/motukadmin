"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, CircularProgress } from "@mui/material";
import { auth, db } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function AdminGuard({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setAuthorized(false);
      try {
        if (!user) { router.replace("/auth"); return; }
        const snap = await getDoc(doc(db, "users", user.uid));
        if (!snap.exists()) { router.replace("/unauthorized"); return; }
        const profile = snap.data();
        if (["disabled", "blocked"].includes(profile.status) || !["admin", "manager"].includes(profile.role)) {
          router.replace("/unauthorized"); return;
        }
        setAuthorized(true);
      } catch (error) {
        console.error(error);
        router.replace("/auth");
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);
  if (loading) return <Box sx={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}><CircularProgress /></Box>;
  return authorized ? children : null;
}
