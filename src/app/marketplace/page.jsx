"use client";

import React, { useEffect, useState } from "react";
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Fab,
    FormControl,
    Grid,
    InputAdornment,
    InputLabel,
    MenuItem,
    Pagination,
    Paper,
    Select,
    TextField,
    Typography
} from "@mui/material";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import SelectAllIcon from "@mui/icons-material/SelectAll";

import Cars from "@/components/product/Cars";

import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    writeBatch
} from "firebase/firestore";

import { db } from "@/firebase";
import { toast } from "react-toastify";
import { CarCrash, Dashboard, DirectionsCarRounded } from "@mui/icons-material";

const cities = [
    "Kinshasa",
    "Lubumbashi",
    "Goma",
    "Matadi",
    "Kolwezi",
    "Bukavu",
    "Kananga",
    "Mbuji-Mayi",
    "Kisangani"
];

const types = [
    {
        value: "sale",
        label: "Véhicules"
    },
    {
        value: "rent",
        label: "Location"
    },
    {
        value: "parts",
        label: "Pièces"
    }
];

const statuses = [
    {
        value: "validated",
        label: "Validés"
    },
    {
        value: "init",
        label: "En attente"
    },
    {
        value: "hidden",
        label: "Masqués"
    },
    {
        value: "sold",
        label: "Vendus"
    }
];

const Products = () => {
    const [products, setProducts] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState("");
    const [city, setCity] = useState("");
    const [type, setType] = useState("");
    const [status, setStatus] = useState("");
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);

    const itemsPerPage = 20;
    const [page, setPage] = useState(1);

    const start = (page - 1) * itemsPerPage;

    const currentItems = filtered.slice(
        start,
        start + itemsPerPage
    );

    const pages = Math.ceil(
        filtered.length / itemsPerPage
    );

    /*
    =========================
        FIRESTORE
    =========================
    */

    useEffect(() => {
        const conditions = [];

        if (city) {
            conditions.push(
                where("city", "==", city)
            );
        }

        if (type) {
            conditions.push(
                where("type", "==", type)
            );
        }

        if (status) {
            conditions.push(
                where("status", "==", status)
            );
        }

        const q = query(
            collection(db, "products"),
            ...conditions,
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const data = snapshot.docs.map(
                    (item) => ({
                        id: item.id,
                        ...item.data()
                    })
                );

                setProducts(data);
                setFiltered(data);
                setPage(1);
            }
        );

        return unsubscribe;
    }, [city, type, status]);

    /*
    =========================
        SEARCH
    =========================
    */

    useEffect(() => {
        const value = search.toLowerCase().trim();

        if (!value) {
            setFiltered(products);
            setPage(1);
            return;
        }

        const result = products.filter((item) => {
            const text = [
                item.name,
                item.description,
                item.city,
                item.brand,
                item.displayName
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return text.includes(value);
        });

        setFiltered(result);
        setPage(1);
    }, [search, products]);

    /*
    =========================
        SELECTION
    =========================
    */

    const selectProduct = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id]
        );
    };

    /*
    =========================
        ACTIONS GROUPÉES
    =========================
    */

    const updateStatus = async (newStatus) => {
        if (!selectedIds.length) return;

        setLoading(true);

        try {
            const batch = writeBatch(db);

            selectedIds.forEach((id) => {
                batch.update(
                    doc(db, "products", id),
                    {
                        status: newStatus,
                        updatedAt: Date.now()
                    }
                );
            });

            await batch.commit();

            toast.success("Action effectuée");

            setSelectedIds([]);
            setSelectionMode(false);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const deleteSelected = async () => {
        if (
            !window.confirm(
                `Supprimer ${selectedIds.length} annonces ?`
            )
        ) {
            return;
        }

        setLoading(true);

        try {
            const batch = writeBatch(db);

            selectedIds.forEach((id) => {
                batch.delete(
                    doc(db, "products", id)
                );
            });

            await batch.commit();

            toast.success("Annonces supprimées");

            setSelectedIds([]);
            setSelectionMode(false);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main>
            <Grid
                container
                spacing={2}
                sx={{ p: 3 }}
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
                        <DirectionsCarRounded
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
                            Marketplace
                        </Typography>
                    </Box>

                    <Typography color="text.secondary">
                        Gérez les véhicules et les annonces publiés sur Motuka.
                    </Typography>
                </Box>

                {/* SEARCH + FILTERS */}
                <Grid size={12}>
                    <Box
                        sx={{
                            p: 2,
                            borderRadius: 4,
                            border: "1px solid",
                            borderColor: "divider",
                            backgroundColor: "background.paper"
                        }}
                    >
                        <Grid
                            container
                            spacing={2}
                        >
                            {/* Recherche */}
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 5
                                }}
                            >
                                <TextField
                                    fullWidth
                                    placeholder="Rechercher un véhicule..."
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target.value
                                        )
                                    }
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchRoundedIcon />
                                                </InputAdornment>
                                            )
                                        }
                                    }}
                                />
                            </Grid>

                            {/* Ville */}
                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6,
                                    md: 2
                                }}
                            >
                                <FormControl fullWidth>
                                    <InputLabel>
                                        Ville
                                    </InputLabel>

                                    <Select
                                        value={city}
                                        label="Ville"
                                        onChange={(e) =>
                                            setCity(
                                                e.target.value
                                            )
                                        }
                                    >
                                        <MenuItem value="">
                                            Toutes
                                        </MenuItem>

                                        {cities.map(
                                            (item) => (
                                                <MenuItem
                                                    key={item}
                                                    value={item}
                                                >
                                                    {item}
                                                </MenuItem>
                                            )
                                        )}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Catégorie */}
                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6,
                                    md: 2
                                }}
                            >
                                <FormControl fullWidth>
                                    <InputLabel>
                                        Catégorie
                                    </InputLabel>

                                    <Select
                                        value={type}
                                        label="Catégorie"
                                        onChange={(e) =>
                                            setType(
                                                e.target.value
                                            )
                                        }
                                    >
                                        <MenuItem value="">
                                            Toutes
                                        </MenuItem>

                                        {types.map(
                                            (item) => (
                                                <MenuItem
                                                    key={item.value}
                                                    value={item.value}
                                                >
                                                    {item.label}
                                                </MenuItem>
                                            )
                                        )}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Statut */}
                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6,
                                    md: 2
                                }}
                            >
                                <FormControl fullWidth>
                                    <InputLabel>
                                        Statut
                                    </InputLabel>

                                    <Select
                                        value={status}
                                        label="Statut"
                                        onChange={(e) =>
                                            setStatus(
                                                e.target.value
                                            )
                                        }
                                    >
                                        <MenuItem value="">
                                            Tous
                                        </MenuItem>

                                        {statuses.map(
                                            (item) => (
                                                <MenuItem
                                                    key={item.value}
                                                    value={item.value}
                                                >
                                                    {item.label}
                                                </MenuItem>
                                            )
                                        )}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Sélection */}
                            <Grid
                                size={{
                                    xs: 12,
                                    md: 1
                                }}
                            >
                                <Button
                                    fullWidth
                                    sx={{
                                        height: "100%",
                                        minHeight: 56
                                    }}
                                    variant={
                                        selectionMode
                                            ? "contained"
                                            : "outlined"
                                    }
                                    startIcon={
                                        <SelectAllIcon />
                                    }
                                    onClick={() => {
                                        setSelectionMode(
                                            !selectionMode
                                        );
                                        setSelectedIds([]);
                                    }}
                                >
                                    <Box
                                        component="span"
                                        sx={{
                                            display: {
                                                xs: "inline",
                                                md: "none",
                                                lg: "inline"
                                            }
                                        }}
                                    >
                                        {selectionMode
                                            ? "Annuler"
                                            : "Sélectionner"}
                                    </Box>
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>

                {/* ACTIONS DE SÉLECTION */}
                {selectedIds.length > 0 && (
                    <Grid size={12}>
                        <Paper
                            elevation={0}
                            sx={{
                                position: "sticky",
                                top: 10,
                                zIndex: 10,
                                p: 2,
                                borderRadius: 4,
                                display: "flex",
                                gap: 1,
                                alignItems: "center",
                                justifyContent:
                                    "space-between",
                                flexWrap: "wrap",
                                border: "1px solid",
                                borderColor: "divider"
                            }}
                        >
                            <Chip
                                label={`${selectedIds.length} sélectionnée(s)`}
                            />

                            <Box
                                display="flex"
                                gap={1}
                                flexWrap="wrap"
                            >
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={
                                        loading ? (
                                            <CircularProgress
                                                size={18}
                                                color="inherit"
                                            />
                                        ) : (
                                            <CheckCircleOutlineIcon />
                                        )
                                    }
                                    disabled={loading}
                                    onClick={() =>
                                        updateStatus(
                                            "validated"
                                        )
                                    }
                                >
                                    Valider
                                </Button>

                                <Button
                                    variant="outlined"
                                    startIcon={
                                        <VisibilityOffOutlinedIcon />
                                    }
                                    disabled={loading}
                                    onClick={() =>
                                        updateStatus(
                                            "hidden"
                                        )
                                    }
                                >
                                    Masquer
                                </Button>

                                <Button
                                    variant="outlined"
                                    color="warning"
                                    startIcon={
                                        <SellOutlinedIcon />
                                    }
                                    disabled={loading}
                                    onClick={() =>
                                        updateStatus(
                                            "sold"
                                        )
                                    }
                                >
                                    Vendu
                                </Button>

                                <Button
                                    variant="contained"
                                    color="error"
                                    startIcon={
                                        <DeleteIcon />
                                    }
                                    disabled={loading}
                                    onClick={
                                        deleteSelected
                                    }
                                >
                                    Supprimer
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                )}

                {/* RÉSULTATS */}
                {currentItems.map((product) => (
                    <Cars
                        key={product.id}
                        data={product}
                        selectionMode={selectionMode}
                        selected={selectedIds.includes(
                            product.id
                        )}
                        onSelect={selectProduct}
                    />
                ))}

                {/* Aucun résultat */}
                {!currentItems.length && (
                    <Grid size={12}>
                        <Box
                            sx={{
                                py: 8,
                                textAlign: "center"
                            }}
                        >
                            <Typography
                                variant="h6"
                                fontWeight={600}
                            >
                                Aucun véhicule trouvé
                            </Typography>

                            <Typography
                                color="text.secondary"
                                sx={{ mt: 1 }}
                            >
                                Essayez de modifier votre
                                recherche ou vos filtres.
                            </Typography>
                        </Box>
                    </Grid>
                )}

                {/* PAGINATION */}
                {pages > 1 && (
                    <Grid
                        size={12}
                        display="flex"
                        justifyContent="center"
                        sx={{ mt: 2 }}
                    >
                        <Pagination
                            count={pages}
                            page={page}
                            onChange={(e, value) =>
                                setPage(value)
                            }
                        />
                    </Grid>
                )}
            </Grid>

            {/* AJOUT */}
            <Fab
                color="primary"
                href="/marketplace/publier"
                component="a"
                sx={{
                    position: "fixed",
                    right: 30,
                    bottom: 30
                }}
            >
                <AddIcon />
            </Fab>
        </main>
    );
};

export default Products;