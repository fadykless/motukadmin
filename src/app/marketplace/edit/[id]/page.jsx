'use client';
import { Box, Button, Grid, InputLabel, MenuItem, Paper, Select, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import DashboardPageHeader from "@/components/includes/DashboardPageHeader";
import CameraAlt from "@mui/icons-material/CameraAlt";
import { LoadingButton } from "@mui/lab";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db } from "@/firebase";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic"; //
import { addDoc, collection } from "firebase/firestore";


const CKEditor = dynamic(() => import("@ckeditor/ckeditor5-react").then(mod => mod.CKEditor), {
    ssr: false,
    loading: () => <p>Chargement de l’éditeur...</p>,
});

const ClassicEditor = typeof window !== "undefined" ? require("@ckeditor/ckeditor5-build-classic") : null;


const EditArticle = () => {
    const router = useRouter();
    const [product, setProduct] = useState({ images: [] });
    const [loading, setLoading] = useState(false);
    const [previews, setPreviews] = useState([]);

    const handleChange = (e) => setProduct({ ...product, [e.target.name]: e.target.value });

    // Fonction pour importer et afficher les images
    const loadFile = (event) => {
        const files = event.target.files;
        const imageArray = Array.from(files);
        const imagePreviews = [];

        imageArray.forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => {
                imagePreviews.push(reader.result);
                setProduct((prev) => ({ ...prev, images: imageArray }));
                setPreviews([...imagePreviews]);
            };
            reader.readAsDataURL(file);
        });
    };

    const redirect = () => router.push("/annonces");

    const handleSubmit = async (event) => {
        event.preventDefault();
        window.alert("Modification désactivée temporairement : API sécurisée en préparation.");
    };

    return (
        <main>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <DashboardPageHeader title="Modifier" />
                </Grid>
            </Grid>

            <Paper elevation={0} sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                name="title"
                                label="Titre"
                                required
                                type="text"
                                fullWidth
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                name="price"
                                label="Prix en USD"
                                required
                                type="text"
                                fullWidth
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid size={12}>
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Description
                                </Typography>

                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: 3,
                                        "& .ck-editor__editable": {
                                            minHeight: "200px",
                                            backgroundColor: "white",
                                            borderRadius: 2,
                                            border: "1px solid #ccc",
                                            padding: 2,
                                        },
                                        "& .ck-toolbar": { borderRadius: "12px 12px 0 0" },
                                    }}
                                >
                                    {ClassicEditor && (
                                        <CKEditor
                                            editor={ClassicEditor}
                                            data={product.description || ""}
                                            onChange={(event, editor) => {
                                                const data = editor.getData();
                                                setProduct({ ...product, description: data });
                                            }}
                                            config={{
                                                toolbar: [
                                                    "heading",
                                                    "|",
                                                    "bold",
                                                    "italic",
                                                    "link",
                                                    "bulletedList",
                                                    "numberedList",
                                                    "|",
                                                    "undo",
                                                    "redo",
                                                ],
                                            }}
                                        />
                                    )}

                                </Paper>
                            </Box>
                        </Grid>

                        <Grid size={8}></Grid>
                        <Grid size={4}>
                            <LoadingButton
                                loading={loading}
                                variant="contained"
                                fullWidth
                                type="submit"
                                sx={{ color: "white", borderRadius: 10 }}
                                disableElevation
                            >
                                Valider
                            </LoadingButton>
                        </Grid>
                    </Grid>
                </form>
            </Paper>
        </main>
    );
};

export default EditArticle;
