"use client";

import React, { useEffect, useState } from "react";

import {
    Box,
    Grid,
    Paper,
    Typography,
    Avatar,
    Divider,
    Button
} from "@mui/material";

import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import SellRoundedIcon from "@mui/icons-material/SellRounded";
import HomeWorkRoundedIcon from "@mui/icons-material/HomeWorkRounded";
import InventoryRoundedIcon from "@mui/icons-material/InventoryRounded";

import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    getCountFromServer
} from "firebase/firestore";

import { db } from "@/firebase";
import moment from "moment";
import "moment/locale/fr";
import { DashboardRounded } from "@mui/icons-material";


const Dashboard = () => {
    const [stats, setStats] = useState({
        products: 0,
        users: 0,
        pending: 0,
        sales: 0,
        rentals: 0,
        parts: 0
    });

    const [latest, setLatest] = useState([]);

    useEffect(() => {
        const loadStats = async () => {
            const productsSnap =
                await getCountFromServer(
                    collection(db, "products")
                );

            const usersSnap =
                await getCountFromServer(
                    collection(db, "users")
                );

            setStats(prev => ({
                ...prev,
                products:
                    productsSnap.data().count,
                users:
                    usersSnap.data().count
            }));
        };

        loadStats();

        const q = query(
            collection(db, "products"),
            orderBy(
                "createdAt",
                "desc"
            ),
            limit(5)
        );

        const unsubscribe =
            onSnapshot(
                q,
                snapshot => {
                    setLatest(
                        snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }))
                    );
                }
            );

        return unsubscribe;
    }, []);

    const cards = [
        {
            title: "Annonces",
            value: stats.products,
            icon: <DirectionsCarRoundedIcon />
        },
        {
            title: "Utilisateurs",
            value: stats.users,
            icon: <PeopleRoundedIcon />
        },
        {
            title: "Offres reçues",
            value: stats.pending,
            icon: <PendingActionsRoundedIcon />
        },
        {
            title: "Ventes",
            value: stats.sales,
            icon: <SellRoundedIcon />
        },
        {
            title: "Locations",
            value: stats.rentals,
            icon: <HomeWorkRoundedIcon />
        },
        {
            title: "Pièces",
            value: stats.parts,
            icon: <InventoryRoundedIcon />
        },
    ];

    return (
        <Box
            sx={{
                p: 3
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
                    <DashboardRounded
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
                        Dashboard
                    </Typography>
                </Box>

                <Typography color="text.secondary">
                    Suivez l’activité et les performances de Motuka en un coup d’œil.
                </Typography>
            </Box>


            <Grid
                container
                spacing={2}
            >
                {
                    cards.map(item => (
                        <Grid
                            item
                            size={{
                                xs: 12,
                                sm: 6,
                                md: 4
                            }}

                            key={item.title}
                        >
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: 4,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2
                                }}
                            >
                                <Avatar
                                    sx={{
                                        width: 55,
                                        height: 55
                                    }}
                                >

                                    {item.icon}
                                </Avatar>

                                <Box>
                                    <Typography
                                        color="text.secondary"
                                    >
                                        {item.title}
                                    </Typography>


                                    <Typography
                                        variant="h4"
                                        fontWeight={800}
                                    >
                                        {item.value}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    ))
                }
            </Grid>


            <Grid
                container
                spacing={3}
                sx={{
                    mt: 2
                }}
            >
                <Grid
                    size={{
                        xs: 12,
                        md: 8
                    }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 4
                        }}
                    >
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            mb={2}
                        >
                            Dernières annonces
                        </Typography>
                        {
                            latest.map(item => (
                                <Box
                                    key={item.id}
                                    sx={{
                                        py: 1.5
                                    }}
                                >
                                    <Typography
                                        fontWeight={600}
                                    >
                                        {item.name}
                                    </Typography>

                                    <Typography
                                        color="text.secondary"
                                        fontSize={14}
                                    >

                                        {
                                            item.city
                                        }
                                        •
                                        {
                                            moment(item.createdAt)
                                                .fromNow()
                                        }
                                    </Typography>

                                    <Divider
                                        sx={{
                                            mt: 1
                                        }}
                                    />
                                </Box>
                            ))
                        }
                    </Paper>
                </Grid>

                <Grid
                    size={{
                        xs: 12,
                        md: 4
                    }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: 4
                        }}
                    >
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            mb={2}
                        >
                            Actions rapides
                        </Typography>

                        <Button
                            disableElevation
                            fullWidth
                            variant="contained"
                            href="/marketplace"
                            sx={{
                                mb: 1,
                                borderRadius: 3
                            }}
                        >
                            Gérer les annonces
                        </Button>

                        <Button
                            fullWidth
                            variant="outlined"
                            href="/utilisateurs"
                            sx={{
                                mb: 1,
                                borderRadius: 3
                            }}
                        >
                            Voir les utilisateurs
                        </Button>

                        <Button
                            fullWidth
                            variant="outlined"
                            href="/settings"
                            sx={{
                                borderRadius: 3
                            }}
                        >
                            Paramètres
                        </Button>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    )
}

export default Dashboard;