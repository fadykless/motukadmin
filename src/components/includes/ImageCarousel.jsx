'use client';

import React, { useState } from "react";
import { Box, CardMedia } from "@mui/material";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

const ImageCarousel = ({ images = [] }) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const openLightbox = () => {
        setIsLightboxOpen(true);
    };

    return (
        <Box sx={{ position: "relative", textAlign: "center" }}>
            {images.length > 0 && (
                <>
                    {/* Image active cliquable */}
                    <CardMedia
                        component="img"
                        image={images[selectedIndex]}
                        alt={`Image ${selectedIndex}`}
                        onClick={openLightbox}
                        sx={{
                            borderRadius: 2,
                            boxShadow: 3,
                            cursor: "zoom-in",
                            maxHeight: 400,
                            width: "100%",
                            objectFit: "cover",
                        }}
                    />

                    {/* Miniatures de navigation */}
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2, gap: 1 }}>
                        {images.map((src, index) => (
                            <CardMedia
                                key={index}
                                component="img"
                                image={src}
                                alt={`Thumbnail ${index}`}
                                onClick={() => setSelectedIndex(index)}
                                sx={{
                                    width: 70,
                                    height: 50,
                                    objectFit: "cover",
                                    cursor: "pointer",
                                    border: selectedIndex === index ? "2px solid #fed336" : "1px solid #ccc",
                                    borderRadius: 1,
                                }}
                            />
                        ))}
                    </Box>
                </>
            )}

            {/* Lightbox moderne */}
            <Lightbox
                open={isLightboxOpen}
                close={() => setIsLightboxOpen(false)}
                index={selectedIndex}
                slides={images.map((src) => ({ src }))}
                plugins={[Thumbnails]}
            />
        </Box>
    );
};

export default ImageCarousel;
