"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
} from "firebase/auth";
import { useEffect } from "react";
import { auth } from "@/firebase";

export default function Login() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.replace("/dashboard");
            }
        });

        return () => unsubscribe();
    }, [router]);

    async function login() {
        try {
            setLoading(true);
            setError("");
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );
            router.push("/dashboard");
        } catch (err) {
            setError("Email ou mot de passe incorrect.");
        } finally {
            setLoading(false);
        }
    }

    async function loginGoogle() {
        try {
            setLoading(true);
            const provider =
                new GoogleAuthProvider();

            await signInWithPopup(
                auth,
                provider
            );
            router.push("/dashboard");
        } catch {

            setError(
                "Connexion impossible."
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                bgcolor: "#f5f5f5"
            }}
        >
            <Container maxWidth="xs">
                <Card
                    elevation={0}
                    sx={{
                        borderRadius: 5
                    }}
                >

                    <CardContent
                        sx={{
                            p: 5
                        }}
                    >

                        <Stack spacing={3}>
                            <Box>
                                <Typography
                                    variant="h3"
                                    fontWeight={900}
                                >
                                    MOTUKA
                                </Typography>

                                <Typography
                                    variant="h5"
                                    mt={1}
                                >
                                    Admin
                                </Typography>

                                <Typography
                                    color="text.secondary"
                                    mt={1}
                                >
                                    Connectez-vous pour gérer
                                    Motuka
                                </Typography>
                            </Box>

                            {
                                error &&
                                <Alert severity="error">
                                    {error}
                                </Alert>
                            }

                            <TextField
                                label="Email"
                                variant="filled"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                            />

                            <TextField
                                type="password"
                                label="Mot de passe"
                                variant="filled"
                                value={password}
                                onChange={(e) =>
                                    setPassword(e.target.value)
                                }
                            />

                            <Button
                                disableElevation
                                variant="contained"
                                size="large"
                                onClick={login}
                                disabled={loading}
                            >

                                {
                                    loading ?
                                        <CircularProgress
                                            size={22}
                                        />
                                        :

                                        "Connexion"
                                }
                            </Button>

                            <Button
                                disableElevation
                                startIcon={<GoogleIcon />}
                                variant="outlined"
                                size="large"
                                onClick={loginGoogle}
                            >
                                Continuer avec Google
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}