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
            try {

                // Non connecté
                if (!user) {
                    router.replace("/auth");
                    return;
                }

                // Profil utilisateur
                const userSnap = await getDoc(
                    doc(db, "users", user.uid)
                );

                // Profil introuvable
                if (!userSnap.exists()) {
                    router.replace("/auth");
                    return;
                }

                const userData = userSnap.data();

                // Compte désactivé (optionnel)
                if (userData.status === "disabled") {
                    router.replace("/unauthorized");
                    return;
                }

                // Vérification des rôles
                if (!["admin", "manager"].includes(userData.role)) {
                    router.replace("/unauthorized");
                    return;
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

    if (loading) {

        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <CircularProgress />
            </Box>
        );

    }

    if (!authorized) return null;

    return children;

}