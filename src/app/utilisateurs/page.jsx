"use client";

import React, { useEffect, useState } from "react";

import {
    Box,
    Grid,
    Paper,
    Typography,
    Avatar,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    TextField,
    FormControl,
    InputLabel,
    Select,
    Divider
} from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import PersonIcon from "@mui/icons-material/Person";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";

import {
    collection,
    onSnapshot,
    query,
    orderBy,
    updateDoc,
    deleteDoc,
    doc
} from "firebase/firestore";

import { db } from "@/firebase";
import { toast } from "react-toastify";

const Users = () => {
    const [users, setUsers] = useState([]);
    const [data, setData] = useState([]);
    const [search, setSearch] = useState("");
    const [role, setRole] = useState("");
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {


        const q = query(

            collection(db, "users"),

            // orderBy(
            //     "createdAt",
            //     "desc"
            // )

        );



        const unsubscribe =
            onSnapshot(q, (snapshot) => {


                const result =
                    snapshot.docs.map(doc => ({

                        id: doc.id,

                        ...doc.data()

                    }));


                setUsers(result);

                setData(result);


            });



        return unsubscribe;


    }, []);


    const filterUsers = (value) => {


        setSearch(value);


        const result =
            users.filter(user => {


                const text =
                    (
                        user.displayName +
                        user.email +
                        user.phoneNumber
                    )
                        .toLowerCase();



                return text.includes(
                    value.toLowerCase()
                );


            });


        setData(result);


    };


    const filterRole = (value) => {


        setRole(value);



        if (!value) {

            setData(users);

            return;

        }



        setData(
            users.filter(
                user => user.role === value
            )
        );
    };

    const openMenu = (event, user) => {

        setAnchorEl(
            event.currentTarget
        );

        setSelectedUser(user);

    };

    const closeMenu = () => {

        setAnchorEl(null);

    };

    const updateStatus = async (status) => {


        try {


            await updateDoc(

                doc(
                    db,
                    "users",
                    selectedUser.id
                ),

                {

                    status

                }

            );



            toast.success(
                "Statut mis à jour"
            );



        }
        catch (error) {

            toast.error(
                error.message
            );

        }



        closeMenu();


    };

    const deleteUser = async () => {
        if (
            !window.confirm(
                "Supprimer cet utilisateur ?"
            )
        )
            return;

        try {
            await deleteDoc(
                doc(
                    db,
                    "users",
                    selectedUser.id
                )
            );

            toast.success(
                "Utilisateur supprimé"
            );

        }
        catch (error) {

            toast.error(
                error.message
            );

        }



        closeMenu();


    };

    return (
        <Box
            sx={{
                p: 3
            }}
        >
            <Typography
                variant="h4"
                fontWeight={700}
                mb={3}
            >
                Utilisateurs
            </Typography>

            <Grid
                container
                spacing={2}
                mb={3}
            >
                <Grid
                    size={{
                        xs: 12,
                        md: 8
                    }}
                >


                    <TextField

                        fullWidth

                        label="Rechercher un utilisateur"

                        value={search}

                        onChange={
                            e => filterUsers(
                                e.target.value
                            )
                        }

                    />


                </Grid>





                <Grid
                    size={{
                        xs: 12,
                        md: 4
                    }}
                >


                    <FormControl fullWidth>


                        <InputLabel>
                            Rôle
                        </InputLabel>


                        <Select

                            value={role}

                            label="Rôle"

                            onChange={
                                e => filterRole(
                                    e.target.value
                                )
                            }

                        >


                            <MenuItem value="">
                                Tous
                            </MenuItem>


                            <MenuItem value="client">
                                Clients
                            </MenuItem>


                            <MenuItem value="seller">
                                Vendeurs
                            </MenuItem>


                            <MenuItem value="driver">
                                Chauffeurs
                            </MenuItem>


                            <MenuItem value="garage">
                                Garages
                            </MenuItem>



                        </Select>


                    </FormControl>


                </Grid>


            </Grid>

            <Grid
                container
                spacing={2}
            >


                {
                    data.map(user => (


                        <Grid

                            size={{
                                xs: 12,
                                md: 6,
                                lg: 4
                            }}

                            key={user.id}

                        >


                            <Paper

                                sx={{

                                    p: 2.5,

                                    borderRadius: 4

                                }}

                            >


                                <Box

                                    display="flex"

                                    alignItems="center"

                                    justifyContent="space-between"

                                >


                                    <Box
                                        display="flex"
                                        gap={2}
                                        alignItems="center"
                                    >


                                        <Avatar

                                            src={
                                                user.photoURL
                                            }

                                        >

                                            <PersonIcon />

                                        </Avatar>



                                        <Box>


                                            <Typography
                                                fontWeight={700}
                                            >

                                                {
                                                    user.displayName ||
                                                    "Utilisateur"
                                                }

                                            </Typography>



                                            <Typography
                                                fontSize={14}
                                                color="text.secondary"
                                            >

                                                {
                                                    user.email
                                                }

                                            </Typography>



                                        </Box>



                                    </Box>





                                    <IconButton

                                        onClick={
                                            e => openMenu(
                                                e,
                                                user
                                            )
                                        }

                                    >


                                        <MoreVertIcon />


                                    </IconButton>


                                </Box>





                                <Divider
                                    sx={{
                                        my: 2
                                    }}
                                />




                                <Typography>

                                    📞 {user.phoneNumber || "-"}

                                </Typography>



                                <Box
                                    display="flex"
                                    gap={1}
                                    mt={2}
                                >


                                    <Chip

                                        size="small"

                                        label={
                                            user.role ||
                                            "client"
                                        }

                                    />


                                    <Chip

                                        size="small"

                                        label={
                                            user.status === "blocked"
                                                ?
                                                "Bloqué"
                                                :
                                                "Actif"
                                        }

                                        color={
                                            user.status === "blocked"
                                                ?
                                                "error"
                                                :
                                                "success"
                                        }

                                    />


                                </Box>



                            </Paper>



                        </Grid>


                    ))

                }



            </Grid>

            <Menu
                anchorEl={anchorEl}
                open={
                    Boolean(anchorEl)
                }
                onClose={closeMenu}
            >

                {
                    selectedUser?.status !== "blocked"
                    &&
                    <MenuItem
                        onClick={() =>
                            updateStatus(
                                "blocked"
                            )
                        }
                    >

                        <BlockIcon
                            sx={{
                                mr: 1
                            }}
                        />
                        Bloquer
                    </MenuItem>
                }


                {
                    selectedUser?.status === "blocked"

                    &&

                    <MenuItem

                        onClick={() =>
                            updateStatus(
                                "active"
                            )
                        }

                    >


                        <CheckCircleIcon
                            sx={{
                                mr: 1
                            }}
                        />

                        Réactiver


                    </MenuItem>


                }




                <MenuItem

                    onClick={deleteUser}

                    sx={{
                        color: "error.main"
                    }}

                >


                    <DeleteIcon
                        sx={{
                            mr: 1
                        }}
                    />


                    Supprimer


                </MenuItem>



            </Menu>
        </Box>
    )
}

export default Users;