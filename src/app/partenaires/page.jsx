"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Avatar,
    Box,
    Chip,
    Container,
    Button,
    Fab,
    FormControl,
    Grid,
    InputAdornment,
    InputLabel,
    MenuItem,
    Select,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import HandshakeRoundedIcon from "@mui/icons-material/HandshakeRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import { adminApi } from "@/lib/client/admin-api";

const cities = [
    "Toutes les villes",
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

const statuses = [
    {
        value: "all",
        label: "Tous les statuts",
    },
    {
        value: "active",
        label: "Actifs",
    },
    {
        value: "blocked",
        label: "Comptes bloqués",
    },
];

const getInitials = (name = "") => {
    return name
        .trim()
        .split(" ")
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase();
};

const formatPhone = (phone = "") => {
    if (!phone) return "Numéro non renseigné";

    return phone;
};

const statusConfig = {
    active: {
        label: "Actif",
        color: "success",
    },
    blocked: {
        label: "Compte bloqué",
        color: "error",
    },
};

const PartnerCard = ({ partner, onRevoke, busy }) => {
    const status = statusConfig[partner.status] || {
        label: "Inconnu",
        color: "default",
    };

    return (
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <Box
                sx={{
                    height: "100%",
                    p: 2.5,
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "background.paper",
                    transition: "all .2s ease",
                    "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: 3,
                    },
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 2,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            minWidth: 0,
                        }}
                    >
                        <Avatar
                            src={partner.photoURL || ""}
                            sx={{
                                width: 52,
                                height: 52,
                                backgroundColor: "primary.main",
                                color: "black",
                                fontWeight: 700,
                            }}
                        >
                            {!partner.photoURL &&
                                getInitials(partner.displayName)}
                        </Avatar>

                        <Box sx={{ minWidth: 0 }}>
                            <Typography
                                color="text.primary"
                                sx={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    fontWeight: 700
                                }}
                            >
                                {partner.displayName ||
                                    "Partenaire sans nom"}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Commissionnaire
                            </Typography>
                        </Box>
                    </Box>

                    <Chip
                        size="small"
                        label={status.label}
                        color={status.color}
                        sx={{
                            fontWeight: 600,
                            flexShrink: 0,
                        }}
                    />
                </Box>

                <Box
                    sx={{
                        mt: 3,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            color: "text.secondary",
                        }}
                    >
                        <PhoneRoundedIcon fontSize="small" />

                        <Typography variant="body2">
                            {formatPhone(partner.phoneNumber)}
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            color: "text.secondary",
                        }}
                    >
                        <LocationOnRoundedIcon fontSize="small" />

                        <Typography variant="body2">
                            {partner.city || "Ville non renseignée"}
                        </Typography>
                    </Box>
                </Box>
                <Button color="error" size="small" sx={{ mt: 2 }} disabled={busy} onClick={() => onRevoke(partner)}>
                    Retirer le statut commissionnaire
                </Button>
            </Box>
        </Grid>
    );
};

export default function PartnersPage() {
    const [partners, setPartners] = useState([]);
    const [search, setSearch] = useState("");
    const [city, setCity] = useState("Toutes les villes");
    const [status, setStatus] = useState("all");
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "error",
    });

    useEffect(() => {
        let active = true;
        adminApi("/api/admin/partners").then(({ partners }) => {
            if (active) setPartners(partners.filter(p => p.partnerType === "commissionnaire"));
        }).catch(error => { console.error("Partners API", error); if (active) setSnackbar({ open: true, severity: "error", message: error.message }); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const revokePartner = async (partner) => {
        if (!window.confirm(`Retirer le statut commissionnaire de ${partner.displayName || partner.id} ?`)) return;
        setBusyId(partner.id);
        try {
            await adminApi("/api/admin/partners", { method: "PATCH", body: JSON.stringify({ uid: partner.id, isPartner: false }) });
            setPartners(previous => previous.filter(item => item.id !== partner.id));
            setSnackbar({ open: true, severity: "success", message: "Statut commissionnaire retiré." });
        } catch (error) {
            setSnackbar({ open: true, severity: "error", message: error.message });
        } finally { setBusyId(null); }
    };

    const filteredPartners = useMemo(() => {
        const query = search.trim().toLowerCase();

        return partners.filter((partner) => {
            const matchesSearch =
                !query ||
                partner.displayName
                    ?.toLowerCase()
                    .includes(query) ||
                partner.phoneNumber
                    ?.toLowerCase()
                    .includes(query);

            const matchesCity =
                city === "Toutes les villes" ||
                partner.city === city;

            const matchesStatus =
                status === "all" ||
                partner.status === status;

            return (
                matchesSearch &&
                matchesCity &&
                matchesStatus
            );
        });
    }, [partners, search, city, status]);

    return (
        <Container
            maxWidth="xl"
            sx={{
                py: {
                    xs: 3,
                    md: 5,
                },
                pb: 12,
            }}
        >
            {/* HEADER */}
            <Box sx={{ mb: 4 }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                    }}
                >
                    <HandshakeRoundedIcon
                        sx={{
                            fontSize: 30,
                            color: "primary.main",
                        }}
                    />

                    <Typography
                        variant="h4"
                        color="text.primary"
                        sx={{ fontWeight: 800 }}
                    >
                        Partenaires
                    </Typography>
                </Box>

                <Typography color="text.secondary">
                    Gérez les commissionnaires qui collaborent
                    avec Motuka.
                </Typography>
            </Box>

            {/* SEARCH + FILTERS */}
            <Box
                sx={{
                    p: 2,
                    mb: 4,
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor: "background.paper",
                }}
            >
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            placeholder="Rechercher un partenaire..."
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchRoundedIcon />
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>
                                Ville
                            </InputLabel>

                            <Select
                                value={city}
                                label="Ville"
                                onChange={(e) =>
                                    setCity(e.target.value)
                                }
                            >
                                {cities.map((item) => (
                                    <MenuItem
                                        key={item}
                                        value={item}
                                    >
                                        {item}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>
                                Statut
                            </InputLabel>

                            <Select
                                value={status}
                                label="Statut"
                                onChange={(e) =>
                                    setStatus(e.target.value)
                                }
                            >
                                {statuses.map((item) => (
                                    <MenuItem
                                        key={item.value}
                                        value={item.value}
                                    >
                                        {item.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </Box>

            {/* RESULTS HEADER */}
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                }}
            >
                <Typography
                    fontWeight={700}
                    color="text.secondary"
                >
                    {filteredPartners.length} partenaire
                    {filteredPartners.length > 1 ? "s" : ""}
                </Typography>
            </Box>

            {/* LOADING */}
            {loading && (
                <Typography color="text.secondary">
                    Chargement des partenaires...
                </Typography>
            )}

            {/* EMPTY */}
            {!loading && filteredPartners.length === 0 && (
                <Box
                    sx={{
                        py: 10,
                        textAlign: "center",
                    }}
                >
                    <HandshakeRoundedIcon
                        sx={{
                            fontSize: 50,
                            color: "text.disabled",
                            mb: 1,
                        }}
                    />

                    <Typography
                        variant="h6"
                        fontWeight={700}
                    >
                        Aucun partenaire trouvé
                    </Typography>

                    <Typography color="text.secondary">
                        Essayez de modifier vos critères de
                        recherche.
                    </Typography>
                </Box>
            )}

            {/* PARTNERS */}
            {!loading && filteredPartners.length > 0 && (
                <Grid container spacing={2}>
                    {filteredPartners.map((partner) => (
                        <PartnerCard
                            key={partner.id}
                            partner={partner}
                            onRevoke={revokePartner}
                            busy={busyId === partner.id}
                        />
                    ))}
                </Grid>
            )}

            {/* FLOATING ACTION BUTTON */}
            <Fab
                color="primary"
                aria-label="Ajouter un partenaire"
                href="/partenaires/ajouter"
                sx={{
                    position: "fixed",
                    right: {
                        xs: 20,
                        md: 32,
                    },
                    bottom: {
                        xs: 20,
                        md: 32,
                    },
                    width: 58,
                    height: 58,
                }}
            >
                <AddRoundedIcon />
            </Fab>

            {/* SNACKBAR */}
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