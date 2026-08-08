import {
    Box,
    Button,
    Container,
    Grid,
    Typography,
} from "@mui/material";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import React from "react";
import { db } from "@/firebase";
import ImageCarousel from "@/components/includes/ImageCarousel";
import Head from "next/head";
//import { etatLabel } from "@/functions";
import parse from 'html-react-parser'
import { Phone } from "@mui/icons-material";

// Fonction pour récupérer les données côté serveur
export async function generateMetadata({ params }) {
    const { id } = await params;
    const docRef = doc(db, "products", id);
    const articleSnapshot = await getDoc(docRef);
    const car = articleSnapshot.exists() ? { id: articleSnapshot.id, ...articleSnapshot.data() } : null;

    return {
        title: car?.name || "Voiture",
        description: car?.description?.slice(0, 200) || "Aucun contenu disponible",
        openGraph: {
            title: car?.name || "Voiture",
            description: car?.description?.slice(0, 200) || "Aucun contenu disponible",
            url: `https://motukapp.com/marketplace/${id}`,
            images: car?.images?.[0] || "default-image-url",
        },
    };
}

const SaleDetails = async ({ params }) => {
    const { id } = await params;
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);
    const product = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product?.name || "Voiture",
        "image": product?.images?.[0] || "default-image-url",
        "description": product?.description || "Aucune description disponible",
        "brand": {
            "@type": "Brand",
            "name": product?.brand || "Motuka"
        },
        "offers": {
            "@type": "Offer",
            "url": `https://motukapp.com/marketplace/${id}`,
            "priceCurrency": product?.currency || "USD",
            "price": product?.price || "0.00",
            "availability": product?.availability ? `https://schema.org/${product.availability}` : "https://schema.org/InStock",
            "itemCondition": product?.etat ? `https://schema.org/${product.etat}` : "https://schema.org/UsedCondition",
        }
    };

    let viewsWeb = docSnap.exists() && typeof docSnap.data().viewsWeb === "number" ? docSnap.data().viewsWeb + 1 : 1;

    if (docSnap.exists()) {
        await updateDoc(docRef, { viewsWeb });
    } else {
        await setDoc(docRef, { viewsWeb }, { merge: true });
    }

    return (
        <>
            {/* 🔹 Injection du JSON-LD */}
            <Head>
                <script type="application/ld+json">
                    {JSON.stringify(jsonLd)}
                </script>
            </Head>

            <Box>

                <Container sx={{ color: 'black' }}>
                    <Grid sx={{ mt: { md: 5, xs: 2 } }} container spacing={2}>
                        <Grid item size={{ xs: 12, md: 6 }}>
                            <ImageCarousel images={product.images} />
                        </Grid>
                        <Grid
                            container
                            direction={"row"}
                            justifyContent={"center"}
                            alignItems={"center"}
                            item
                            size={{ xs: 12, md: 6 }}
                        >
                            <Box>
                                <Container sx={{ mt: 2 }}>
                                    <Typography variant="h3">{product.name || product.title}</Typography>
                                    <Typography fontSize={20}>
                                        {product.etat}
                                    </Typography>
                                    <Typography>{product.views && product.views.length + product.viewsWeb} vues</Typography>
                                    <Typography
                                        textAlign={"center"}
                                        sx={{
                                            mt: 2,
                                            backgroundColor: '#fed336',
                                            color: "black",
                                            p: 0.5,
                                            width: "40%",
                                            borderRadius: 1,
                                            fontSize: 15,
                                        }}
                                    >
                                        {product.price} USD
                                    </Typography>

                                    <Typography sx={{ my: 2 }}>{parse(product.description)}</Typography>
                                    <Button
                                        component='a'
                                        href={'tel:' + product.phoneNumber}
                                        startIcon={<Phone />}
                                        color="black" variant="outlined"
                                        sx={{ borderRadius: 20 }}
                                    >
                                        {product.phoneNumber}
                                    </Button>
                                </Container>
                            </Box>
                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </>
    );
};

export default SaleDetails;
