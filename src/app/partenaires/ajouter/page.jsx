"use client";

import React, { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import { adminApi } from "@/lib/client/admin-api";
import { db } from "@/firebase";
import { LoadingButton } from "@mui/lab";

const cities = [
    "Kinshasa",
    "Lubumbashi",
    "Goma",
    "Kolwezi",
    "Matadi",
    "Bukavu",
    "Kananga",
    "Mbuji-Mayi",
    "Kisangani",
    "Autre",
];

const normalizePhone = (phone) => {
    let number = phone.replace(/\D/g, "");

    // Si le numéro commence par 0 : 0812345678 → 812345678
    number = number.replace(/^0+/, "");

    return `+243${number}`;
};

export default function AddPartner() {
    const [form, setForm] = useState({
        name: "",
        uid: "",
        phone: "",
        city: "",
    });

    const [loading, setLoading] = useState(false);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    const handleChange = (field, value) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const showMessage = (message, severity = "success") => {
        setSnackbar({
            open: true,
            message,
            severity,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name.trim()) {
            showMessage("Veuillez entrer le nom du commissionnaire.", "error");
            return;
        }

        if (!form.phone.trim()) {
            showMessage("Veuillez entrer le numéro de téléphone.", "error");
            return;
        }

        if (!form.city) {
            showMessage("Veuillez sélectionner une ville.", "error");
            return;
        }

        const phoneNumber = normalizePhone(form.phone);

        if (phoneNumber.length < 12) {
            showMessage("Veuillez entrer un numéro de téléphone valide.", "error");
            return;
        }

        setLoading(true);

        try {
            await adminApi("/api/admin/partners", { method: "POST", body: JSON.stringify({ uid: form.uid, displayName: form.name, phoneNumber, city: form.city }) });

            showMessage("Commissionnaire ajouté avec succès.");

            setForm({
                name: "",
                uid: "",
                phone: "",
                city: "",
            });
        } catch (error) {
            console.error(error);

            showMessage(
                "Impossible d'ajouter le commissionnaire.",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 5 }}>
            <Box sx={{ mb: 4 }}>
                <Typography color="text.primary" variant="h4" sx={{ fontWeight: 700 }}>
                    Ajouter un commissionnaire
                </Typography>

                <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Ajoutez un commissionnaire au réseau de partenaires Motuka.
                </Typography>
            </Box>

            <Card
                elevation={0}
                sx={{
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                }}
            >
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                    <form onSubmit={handleSubmit}>
                        <TextField fullWidth required label="UID Firebase Auth du commissionnaire" value={form.uid || ""} onChange={e => handleChange("uid", e.target.value)} sx={{ mb: 2 }} />
                        <TextField
                            label="Nom complet"
                            value={form.name}
                            fullWidth
                            required
                            onChange={(e) =>
                                handleChange("name", e.target.value)
                            }
                            sx={{ mb: 3 }}
                        />

                        <Box
                            sx={{
                                display: "flex",
                                gap: 1,
                                mb: 3,
                            }}
                        >
                            <TextField
                                label="Pays"
                                value="+243"
                                disabled
                                sx={{
                                    width: 100,
                                    flexShrink: 0,
                                }}
                            />

                            <TextField
                                fullWidth
                                label="Numéro de téléphone"
                                placeholder="081 234 56 78"
                                value={form.phone}
                                required
                                type="tel"
                                onChange={(e) =>
                                    handleChange("phone", e.target.value)
                                }
                            />
                        </Box>

                        <FormControl
                            fullWidth
                            required
                            sx={{ mb: 4 }}
                        >
                            <InputLabel>Ville</InputLabel>

                            <Select
                                value={form.city}
                                label="Ville"
                                onChange={(e) =>
                                    handleChange("city", e.target.value)
                                }
                            >
                                {cities.map((city) => (
                                    <MenuItem key={city} value={city}>
                                        {city}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <LoadingButton
                            type="submit"
                            variant="contained"
                            loading={loading}
                            fullWidth
                        >
                            Ajouter le commissionnaire
                        </LoadingButton>
                    </form>
                </CardContent>
            </Card>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() =>
                    setSnackbar((prev) => ({
                        ...prev,
                        open: false,
                    }))
                }
            >
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    onClose={() =>
                        setSnackbar((prev) => ({
                            ...prev,
                            open: false,
                        }))
                    }
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}