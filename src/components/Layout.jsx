'use client'
import React from "react";
import { Box, Container, CssBaseline, Toolbar } from "@mui/material";
import Footer from "./footer";
import Navbar from "./navbar";
import { auth } from "@/firebase";


const Layout = ({ children }) => {
    // const [admin, setAdmin] = useState(null);

    console.log(auth)

    // useEffect(() => {
    //     setAdmin(localStorage.getItem("market1fluenceAdminID"));
    // }, [admin]);

    if (!auth && auth.currentUser.uid) {
        return (
            <Box>
                <CssBaseline />
                {children}
                <Footer />
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex" }}>
            <CssBaseline />
            <Navbar />
            <Box
                component="main"
                sx={{
                    backgroundColor: (theme) =>
                        theme.palette.mode === "light"
                            ? theme.palette.grey[100]
                            : theme.palette.grey[900],
                    flexGrow: 1,
                    height: "100vh",
                    overflow: "auto",
                }}
            >
                <Toolbar />
                <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                    {children}
                    <Footer sx={{ pt: 4 }} />
                </Container>
            </Box>
        </Box>
    )
};

export default Layout;
