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


const AddArticle = () => {
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const storage = getStorage();
        const colRef = collection(db, "products");

        try {
            // Tableau pour stocker les promesses d'upload d'images
            const imageUploadPromises = product.images.map((image) => {
                return new Promise((resolve, reject) => {
                    const uniqueImageName = `${new Date().getTime()}_${image.name}`; // Générer un nom unique
                    const storageRef = ref(storage, "images/" + uniqueImageName);
                    const metadata = { contentType: image.type };

                    const uploadTask = uploadBytesResumable(storageRef, image, metadata);

                    uploadTask.on(
                        "state_changed",
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            console.log(`Upload is ${progress}% done for ${image.name}`);
                        },
                        (error) => {
                            console.error(`Error uploading image ${image.name}:`, error);
                            reject(error);
                        },
                        () => {
                            // Récupérer l'URL après téléchargement
                            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                                resolve(downloadURL);
                            });
                        }
                    );
                });
            });

            // Attendre que toutes les images soient uploadées
            const imageURLs = await Promise.all(imageUploadPromises);

            // Ajouter le document avec les URLs des images à Firestore
            await addDoc(colRef, {
                ...product,
                images: imageURLs, // Stocker les URLs des images dans le document
                createdAt: new Date().getTime(),
                status: 'validated'
            });

            setLoading(false);
            redirect()
        } catch (err) {
            setLoading(false);
            console.log("Error adding product:", err);
        }
    };


    return (
        <main>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <DashboardPageHeader title="Publier une annonce" />
                </Grid>
            </Grid>

            <Paper elevation={0} sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                name="name"
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

                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                name="phoneNumber"
                                label="Téléphone"
                                required
                                type="phone"
                                fullWidth
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <InputLabel id="author-label">Type d'annonce</InputLabel>
                            <Select
                                labelId="author-label"
                                value={product.type || ""}
                                name="type"
                                onChange={handleChange}
                                fullWidth
                                required
                            >

                                <MenuItem key={'rental'} value={'rental'}>
                                    Location de véhicule
                                </MenuItem>
                                <MenuItem key={'sale'} value={'sale'}>
                                    Véhicule à vendre
                                </MenuItem>
                                <MenuItem key={'accessory'} value={'accessory'}>
                                    Pièce ou accessoire
                                </MenuItem>

                            </Select>
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <InputLabel id="author-label">Etat du produit</InputLabel>
                            <Select
                                labelId="author-label"
                                value={product.etat || ""}
                                name="etat"
                                onChange={handleChange}
                                fullWidth
                                required
                            >
                                <MenuItem key={'used'} value={'used'}>
                                    {"Occasion"}
                                </MenuItem>
                                <MenuItem key={'new'} value={'new'}>
                                    {"Neuf"}
                                </MenuItem>
                                <MenuItem key={'out-of-usage'} value={'out-of-usage'}>
                                    {"Hors usage"}
                                </MenuItem>
                            </Select>
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

                        <Grid sx={{ mt: 5 }} size={12}>
                            <input
                                accept="image/*"
                                style={{ display: "none" }}
                                id="import"
                                type="file"
                                onChange={loadFile}
                                multiple
                            />
                            <label htmlFor="import">
                                <Button startIcon={<CameraAlt />} variant="outlined" component="span">
                                    Importer des images
                                </Button>
                            </label>
                        </Grid>

                        <Grid size={12}>
                            <Typography sx={{ textAlign: "center" }}>
                                {previews.map((preview, i) => (
                                    <img key={i} src={preview} alt={`Preview ${i}`} width={200} style={{ margin: 5 }} />
                                ))}
                            </Typography>
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

export default AddArticle;
