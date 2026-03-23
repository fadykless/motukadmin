'use client'
import { Container, Grid2, List, ListItem, ListItemText, Typography, useTheme } from '@mui/material'
import { Box } from '@mui/system'
import React from 'react'

function RentalDetails({ car }) {
    const theme = useTheme()
    return (
        <Grid2
            container
            direction={"row"}
            justifyContent={"center"}
            alignItems={"center"}
            item
            size={{ xs: 12, md: 6 }}
        >
            <Box sx={{ p: 3 }}>
                <Container>
                    <Typography variant="h3">{car.name}</Typography>
                    <Typography
                        textAlign={"center"}
                        sx={{
                            mt: 2,
                            backgroundColor: theme.palette.primary.main,
                            color: "black",
                            p: 0.5,
                            width: "40%",
                            borderRadius: 1,
                            fontSize: 15,
                        }}
                    >
                        {car.price} USD/jour
                    </Typography>

                    <Typography sx={{ my: 2 }}>
                        <List dense>
                            <ListItem>
                                <ListItemText primary="La location journalière commence de 8h à 21h " />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="La location est uniquement avec Chauffeur" />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Le carburant est à la charge du client" />
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Le prix de la location est fixé pour une circulation dans la ville, en dehors de la ville le tarif compte double pour la location journalière" />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="Une penalité de 20$/h est appliquée pour les heures
supplémentaires."
                                />
                            </ListItem>
                        </List>
                    </Typography>
                    {/* <Typography textAlign={"center"} sx={{ mb: 4 }}>
            <BookingModal car={car} open={open} setOpen={setOpen} />
        </Typography> */}
                </Container>
            </Box>
        </Grid2>
    )
}

export default RentalDetails