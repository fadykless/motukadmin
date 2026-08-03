'use client';

import { useEffect, useState } from "react";
import {
    Box,
    Container,
    CssBaseline,
    Toolbar,
    CircularProgress,
} from "@mui/material";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";

import Navbar from "./navbar";
import Footer from "./footer";
import AdminGuard from "./auth/AdminGuard";

export default function Layout({ children }) {

    const [user, setUser] = useState(undefined);

    useEffect(() => {

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
        });

        return () => unsubscribe();

    }, []);

    // En attente de Firebase
    if (user === undefined) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "100vh",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    // Non connecté
    if (!user) {
        return (
            <Box>
                <CssBaseline />
                {children}
            </Box>
        );
    }

    // Connecté
    return (
        <Box sx={{ display: "flex" }}>
            <CssBaseline />

            <Navbar />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    minHeight: "100vh",
                    overflow: "auto",
                    bgcolor: (theme) =>
                        theme.palette.mode === "light"
                            ? theme.palette.grey[100]
                            : theme.palette.grey[900],
                }}
            >
                <Toolbar />

                <Container
                    maxWidth="xl"
                    sx={{
                        mt: 4,
                        mb: 4,
                    }}
                >
                    <AdminGuard>
                        {children}
                    </AdminGuard>

                    <Footer sx={{ mt: 5 }} />
                </Container>

            </Box>
        </Box>
    );
}