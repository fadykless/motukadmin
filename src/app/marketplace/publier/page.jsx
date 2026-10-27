'use client';

import {
    Box,
    Button,
    Grid,
    InputLabel,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import DashboardPageHeader from "@/components/includes/DashboardPageHeader";
import CameraAlt from "@mui/icons-material/CameraAlt";
import { LoadingButton } from "@mui/lab";
import {
    getStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL
} from "firebase/storage";
import { db } from "@/firebase";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
    collection,
    onSnapshot
} from "firebase/firestore";
import { toast } from "react-toastify";
import { adminApi } from "@/lib/client/admin-api";
import { DirectionsCarRounded } from "@mui/icons-material";

const CKEditor = dynamic(
    () =>
        import("@ckeditor/ckeditor5-react").then(
            (mod) => mod.CKEditor
        ),
    {
        ssr: false,
        loading: () => <p>Chargement de l’éditeur...</p>,
    }
);

const ClassicEditor =
    typeof window !== "undefined"
        ? require("@ckeditor/ckeditor5-build-classic")
        : null;

const cities = [
    "Kinshasa",
    "Matadi",
    "Goma",
    "Lubumbashi",
    "Kolwezi",
];

const AddArticle = () => {
    const router = useRouter();

    const [product, setProduct] = useState({
        images: [],
    });

    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previews, setPreviews] = useState([]);

    /*
    =========================
    PARTENAIRES
    =========================
    */

    useEffect(() => {
        let active = true;
        adminApi("/api/admin/partners").then(({ partners }) => {
            if (active) setPartners(partners.filter(p => p.status === "active"));
        }).catch(error => toast.error(error.message));
        return () => { active = false; };
    }, []);


    /*
    =========================
    CHANGE
    =========================
    */

    const handleChange = (e) => {
        setProduct((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    /*
    =========================
    PARTENAIRE
    =========================
    */

    const handlePartnerChange = (e) => {
        const partnerId = e.target.value;

        const partner = partners.find(
            (item) => item.id === partnerId
        );

        if (!partner) {
            setProduct((prev) => ({
                ...prev,
                partner: "",
            }));

            return;
        }

        setProduct((prev) => ({
            ...prev,
            partner: partnerId,
            partnerName: partner.displayName || "",
            phoneNumber: "", // Les coordonnées du commissionnaire ne sont pas des données publiques.
            city: partner.city || "",
        }));
    };

    /*
    =========================
    IMAGES
    =========================
    */

    const loadFile = (event) => {
        const files = Array.from(event.target.files || []);

        if (!files.length) {
            return;
        }

        setProduct((prev) => ({
            ...prev,
            images: files,
        }));

        const imagePreviews = files.map((file) =>
            URL.createObjectURL(file)
        );

        setPreviews(imagePreviews);
    };

    /*
    =========================
    UPLOAD IMAGE
    =========================
    */

    const uploadImages = async (images) => {
        if (!images.length) {
            throw new Error(
                "Veuillez importer au moins une image."
            );
        }

        const storage = getStorage();

        let totalBytes = images.reduce(
            (total, image) => total + image.size,
            0
        );

        let uploadedBytes = 0;

        setUploadProgress(0);

        const promises = images.map((image) => {
            return new Promise((resolve, reject) => {
                const uniqueImageName = `${Date.now()}_${Math.random()
                    .toString(36)
                    .substring(2)}_${image.name}`;

                const storageRef = ref(
                    storage,
                    `images/${uniqueImageName}`
                );

                const metadata = {
                    contentType: image.type,
                };

                const uploadTask =
                    uploadBytesResumable(
                        storageRef,
                        image,
                        metadata
                    );

                uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                        const currentUploaded =
                            uploadedBytes +
                            snapshot.bytesTransferred;

                        const progress =
                            (currentUploaded /
                                totalBytes) *
                            100;

                        setUploadProgress(
                            Math.min(
                                Math.round(progress),
                                100
                            )
                        );
                    },
                    (error) => {
                        reject(error);
                    },
                    async () => {
                        try {
                            const downloadURL =
                                await getDownloadURL(
                                    uploadTask.snapshot
                                        .ref
                                );

                            uploadedBytes += image.size;

                            const progress =
                                (uploadedBytes /
                                    totalBytes) *
                                100;

                            setUploadProgress(
                                Math.min(
                                    Math.round(progress),
                                    100
                                )
                            );

                            resolve(downloadURL);
                        } catch (error) {
                            reject(error);
                        }
                    }
                );
            });
        });

        return Promise.all(promises);
    };

    /*
    =========================
    SUBMIT
    =========================
    */

    const handleSubmit = async (e) => {
        e.preventDefault();
        toast.error("Publication administrative temporairement désactivée : contrôle du propriétaire et des données privées en cours.");
    };

    return (
        <main>
            <Grid container spacing={2}>
                <Grid size={12}>
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
                                Publier une annonce
                            </Typography>
                        </Box>

                        <Typography color="text.secondary">
                            Ajoutez un véhicule ou un produit au marketplace de Motuka.
                        </Typography>
                    </Box>
                </Grid>
            </Grid>

            <Paper
                elevation={0}
                sx={{ p: 3 }}
            >
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>

                        {/* TITRE */}
                        <Grid size={12}>
                            <TextField
                                name="name"
                                label="Titre"
                                fullWidth
                                required
                                value={product.name || ""}
                                onChange={handleChange}
                            />
                        </Grid>

                        {/* PARTENAIRE */}
                        <Grid
                            size={{
                                xs: 12,
                                md: 6,
                            }}
                        >
                            <InputLabel>
                                Partenaire
                            </InputLabel>

                            <Select
                                value={
                                    product.partner || ""
                                }
                                onChange={
                                    handlePartnerChange
                                }
                                fullWidth
                                displayEmpty
                            >
                                <MenuItem value="">
                                    Aucun partenaire
                                </MenuItem>

                                {partners.map(
                                    (partner) => (
                                        <MenuItem
                                            key={
                                                partner.id
                                            }
                                            value={
                                                partner.id
                                            }
                                        >
                                            {partner.displayName}
                                        </MenuItem>
                                    )
                                )}
                            </Select>
                        </Grid>

                        {/* VILLE */}
                        <Grid
                            size={{
                                xs: 12,
                                md: 6,
                            }}
                        >
                            <InputLabel>
                                Ville
                            </InputLabel>

                            <Select
                                value={
                                    product.city || ""
                                }
                                name="city"
                                onChange={
                                    handleChange
                                }
                                fullWidth
                                required
                            >
                                <MenuItem value="">
                                    Sélectionner
                                </MenuItem>

                                {cities.map(
                                    (city) => (
                                        <MenuItem
                                            key={city}
                                            value={city}
                                        >
                                            {city}
                                        </MenuItem>
                                    )
                                )}
                            </Select>
                        </Grid>

                        {/* PRIX */}
                        <Grid
                            size={{
                                xs: 12,
                                md: 6,
                            }}
                        >
                            <TextField
                                name="price"
                                label="Prix en USD"
                                fullWidth
                                required
                                type="number"
                                value={
                                    product.price || ""
                                }
                                onChange={
                                    handleChange
                                }
                            />
                        </Grid>

                        {/* TELEPHONE */}
                        <Grid
                            size={{
                                xs: 12,
                                md: 6,
                            }}
                        >
                            <TextField
                                name="phoneNumber"
                                label="Téléphone"
                                fullWidth
                                type="tel"
                                value={
                                    product.phoneNumber ||
                                    ""
                                }
                                onChange={
                                    handleChange
                                }
                            />
                        </Grid>

                        {/* TYPE */}
                        <Grid
                            size={{
                                xs: 12,
                                md: 6,
                            }}
                        >
                            <InputLabel>
                                Type d&apos;annonce
                            </InputLabel>

                            <Select
                                value={
                                    product.type || ""
                                }
                                name="type"
                                onChange={
                                    handleChange
                                }
                                fullWidth
                                required
                            >
                                <MenuItem value="rent">
                                    Location de véhicule
                                </MenuItem>

                                <MenuItem value="sale">
                                    Véhicule à vendre
                                </MenuItem>

                                <MenuItem value="parts">
                                    Pièce ou accessoire
                                </MenuItem>
                            </Select>
                        </Grid>

                        {/* ETAT */}
                        <Grid
                            size={{
                                xs: 12,
                                md: 6,
                            }}
                        >
                            <InputLabel>
                                Etat du produit
                            </InputLabel>

                            <Select
                                value={
                                    product.etat || ""
                                }
                                name="etat"
                                onChange={
                                    handleChange
                                }
                                fullWidth
                                required
                            >
                                <MenuItem value="used">
                                    Occasion
                                </MenuItem>

                                <MenuItem value="new">
                                    Neuf
                                </MenuItem>

                                <MenuItem value="damaged">
                                    Endommagé
                                </MenuItem>
                            </Select>
                        </Grid>

                        {/* DESCRIPTION */}
                        <Grid size={12}>
                            <Box sx={{ mt: 3 }}>
                                <Typography
                                    variant="h6"
                                    gutterBottom
                                >
                                    Description
                                </Typography>

                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: 3,
                                        "& .ck-editor__editable":
                                        {
                                            minHeight:
                                                "200px",
                                            backgroundColor:
                                                "white",
                                            borderRadius:
                                                2,
                                            border:
                                                "1px solid #ccc",
                                            padding: 2,
                                        },
                                        "& .ck-toolbar":
                                        {
                                            borderRadius:
                                                "12px 12px 0 0",
                                        },
                                    }}
                                >
                                    {ClassicEditor && (
                                        <CKEditor
                                            editor={
                                                ClassicEditor
                                            }
                                            data={
                                                product.description ||
                                                ""
                                            }
                                            onChange={(
                                                event,
                                                editor
                                            ) => {
                                                const value =
                                                    editor.getData();

                                                setProduct(
                                                    (
                                                        prev
                                                    ) => ({
                                                        ...prev,
                                                        description:
                                                            value,
                                                    })
                                                );
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

                        {/* IMAGES */}
                        <Grid
                            sx={{ mt: 5 }}
                            size={12}
                        >
                            <input
                                accept="image/*"
                                style={{
                                    display: "none",
                                }}
                                id="import"
                                type="file"
                                onChange={loadFile}
                                multiple
                                required
                            />

                            <label htmlFor="import">
                                <Button
                                    startIcon={
                                        <CameraAlt />
                                    }
                                    variant="outlined"
                                    component="span"
                                >
                                    Importer des images *
                                </Button>
                            </label>

                            {!product.images?.length && (
                                <Typography
                                    variant="caption"
                                    color="error"
                                    sx={{
                                        display: "block",
                                        mt: 1,
                                    }}
                                >
                                    Au moins une image
                                    est obligatoire.
                                </Typography>
                            )}
                        </Grid>

                        {/* PREVIEWS */}
                        {previews.length > 0 && (
                            <Grid size={12}>
                                <Typography>
                                    {previews.map(
                                        (
                                            preview,
                                            i
                                        ) => (
                                            <img
                                                key={i}
                                                src={
                                                    preview
                                                }
                                                alt={`Preview ${i}`}
                                                width={
                                                    150
                                                }
                                                style={{
                                                    margin: 5,
                                                    borderRadius: 8,
                                                    objectFit:
                                                        "cover",
                                                }}
                                            />
                                        )
                                    )}
                                </Typography>
                            </Grid>
                        )}

                        {/* PROGRESS */}
                        {loading && (
                            <Grid size={12}>
                                <Box sx={{ mt: 2 }}>
                                    <Box
                                        sx={{
                                            display:
                                                "flex",
                                            justifyContent:
                                                "space-between",
                                            mb: 0.5,
                                        }}
                                    >
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                        >
                                            Upload des
                                            images...
                                        </Typography>

                                        <Typography
                                            variant="body2"
                                            fontWeight={600}
                                        >
                                            {
                                                uploadProgress
                                            }
                                            %
                                        </Typography>
                                    </Box>

                                    <LinearProgress
                                        variant="determinate"
                                        value={
                                            uploadProgress
                                        }
                                        sx={{
                                            height: 8,
                                            borderRadius: 10,
                                        }}
                                    />
                                </Box>
                            </Grid>
                        )}

                        {/* BUTTON */}
                        <Grid
                            size={{
                                xs: 12,
                                md: 4,
                            }}
                            sx={{
                                ml: "auto",
                                mt: 3,
                            }}
                        >
                            <LoadingButton
                                loading={loading}
                                variant="contained"
                                fullWidth
                                type="submit"
                                disabled={
                                    !product.images
                                        ?.length
                                }
                                sx={{
                                    color: "white",
                                    borderRadius: 10,
                                }}
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