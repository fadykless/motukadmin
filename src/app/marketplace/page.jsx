"use client";

import React, { useEffect, useState } from "react";

import {
    Box,
    Button,
    Grid,
    Pagination,
    Paper,
    Typography,
    Fab,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    CircularProgress
} from "@mui/material";


import SearchBar from "@/components/includes/SearchBar";
import Cars from "@/components/product/Cars";


import AddIcon from "@mui/icons-material/Add";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import SelectAllIcon from "@mui/icons-material/SelectAll";


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

    const start =
        (page - 1) * itemsPerPage;

    const currentItems =
        filtered.slice(
            start,
            start + itemsPerPage
        );

    const pages =
        Math.ceil(
            filtered.length / itemsPerPage
        );
    /*
    =========================
        FIRESTORE
    =========================
    */

    useEffect(() => {
        let conditions = [];
        if (city)
            conditions.push(
                where("city", "==", city)
            );
        if (type)
            conditions.push(
                where("type", "==", type)
            );
        if (status)
            conditions.push(
                where("status", "==", status)
            );
        const q = query(
            collection(db, "products"),
            ...conditions,
            orderBy(
                "createdAt",
                "desc"
            )
        );

        const unsubscribe =
            onSnapshot(
                q,
                snapshot => {
                    const data =
                        snapshot.docs.map(
                            doc => ({
                                id: doc.id,
                                ...doc.data()
                            })
                        );

                    setProducts(data);
                    setFiltered(data);
                }
            );

        return unsubscribe;
    }, [
        city,
        type,
        status
    ]);

    /*
    =========================
        SEARCH
    =========================
    */

    const searchFilter = (value) => {
        setSearch(value);
        const result =
            products.filter(item => {


                const text =
                    (
                        item.name +
                        item.description +
                        item.city
                    )
                        .toLowerCase();



                return text.includes(
                    value.toLowerCase()
                );
            });

        setFiltered(result);
        setPage(1);
    };

    /*
    =========================
        SELECTION
    =========================
    */

    const selectProduct = (id) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ?
                prev.filter(
                    item => item !== id
                )
                :
                [
                    ...prev,
                    id
                ]
        );
    };


    const selectAll = () => {
        if (
            selectedIds.length === currentItems.length
        ) {
            setSelectedIds([]);
            return;
        }

        setSelectedIds(
            currentItems.map(
                item => item.id
            )
        );
    };

    /*
    =========================
        ACTIONS GROUPÉES
    =========================
    */

    const updateStatus = async (status) => {
        if (!selectedIds.length)
            return;
        setLoading(true);
        try {
            const batch =
                writeBatch(db);
            selectedIds.forEach(id => {
                batch.update(
                    doc(
                        db,
                        "products",
                        id
                    ),
                    {
                        status,
                        updatedAt:
                            Date.now()
                    }
                );
            });

            await batch.commit();

            toast.success(
                "Action effectuée"
            );

            setSelectedIds([]);
            setSelectionMode(false);
        }
        catch (error) {
            toast.error(
                error.message
            );
        }
        finally {
            setLoading(false);
        }
    };


    const deleteSelected = async () => {
        if (
            !window.confirm(
                `Supprimer ${selectedIds.length} annonces ?`
            )
        )
            return;

        setLoading(true);

        try {
            const batch =
                writeBatch(db);
            selectedIds.forEach(id => {
                batch.delete(
                    doc(
                        db,
                        "products",
                        id
                    )
                );
            });

            await batch.commit();

            toast.success(
                "Annonces supprimées"
            );

            setSelectedIds([]);
            setSelectionMode(false);
        }
        catch (error) {
            toast.error(
                error.message
            );
        }
        finally {
            setLoading(false);
        }
    };


    return (
        <main>
            <Grid
                container
                spacing={2}
                sx={{
                    p: 3
                }}
            >

                <Grid size={12}>

                    <SearchBar
                        searchFilter={searchFilter}
                        placeholder="Rechercher un véhicule..."
                    />
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                    <Button
                        fullWidth
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

                        {
                            selectionMode
                                ?
                                "Annuler"
                                :
                                "Sélectionner"
                        }
                    </Button>
                </Grid>


                <Grid size={{ xs: 12, md: 3 }}>
                    <FormControl fullWidth>
                        <InputLabel>
                            Ville
                        </InputLabel>

                        <Select
                            value={city}
                            label="Ville"
                            onChange={
                                e => setCity(
                                    e.target.value
                                )
                            }
                        >
                            <MenuItem value="">
                                Toutes
                            </MenuItem>

                            <MenuItem value="Kinshasa">
                                Kinshasa
                            </MenuItem>

                            <MenuItem value="Lubumbashi">
                                Lubumbashi
                            </MenuItem>

                            <MenuItem value="Goma">
                                Goma
                            </MenuItem>

                            <MenuItem value="Matadi">
                                Matadi
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                    <FormControl fullWidth>
                        <InputLabel>
                            Catégorie
                        </InputLabel>

                        <Select
                            value={type}
                            label="Catégorie"
                            onChange={
                                e => setType(
                                    e.target.value
                                )
                            }
                        >
                            <MenuItem value="">
                                Toutes
                            </MenuItem>

                            <MenuItem value="sale">
                                Véhicules
                            </MenuItem>

                            <MenuItem value="rent">
                                Location
                            </MenuItem>

                            <MenuItem value="parts">
                                Pièces
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                    <FormControl fullWidth>
                        <InputLabel>
                            Statut
                        </InputLabel>

                        <Select
                            value={status}
                            label="Statut"
                            onChange={
                                e => setStatus(
                                    e.target.value
                                )
                            }
                        >

                            <MenuItem value="">
                                Tous
                            </MenuItem>

                            <MenuItem value="validated">
                                Validés
                            </MenuItem>

                            <MenuItem value="init">
                                En attente
                            </MenuItem>

                            <MenuItem value="hidden">
                                Masqués
                            </MenuItem>

                            <MenuItem value="sold">
                                Vendus
                            </MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                {
                    selectedIds.length > 0 &&
                    <Grid size={12}>
                        <Paper
                            sx={{
                                position: "sticky",
                                top: 10,
                                zIndex: 10,
                                p: 2,
                                borderRadius: 4,
                                display: "flex",
                                gap: 1,
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap"
                            }}
                        >

                            <Box>
                                <Chip
                                    label={
                                        `${selectedIds.length} sélectionnée(s)`
                                    }
                                />
                            </Box>

                            <Box
                                display="flex"
                                gap={1}
                                flexWrap="wrap"
                            >
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={
                                        <CheckCircleOutlineIcon />
                                    }
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
                                    onClick={deleteSelected}
                                >
                                    Supprimer
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                }




                {
                    currentItems.map(product =>
                        <Cars
                            key={product.id}
                            data={product}
                            selectionMode={
                                selectionMode
                            }
                            selected={
                                selectedIds.includes(
                                    product.id
                                )
                            }
                            onSelect={
                                selectProduct
                            }
                        />
                    )
                }


                <Grid
                    size={12}
                    display="flex"
                    justifyContent="center"
                >
                    <Pagination
                        count={pages}
                        page={page}
                        onChange={
                            (e, v) => setPage(v)
                        }
                    />
                </Grid>
            </Grid>

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

    )

}


export default Products;