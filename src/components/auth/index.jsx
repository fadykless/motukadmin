'use client'
import { Grid, Paper } from '@mui/material'
import React, { useEffect, useState } from 'react'
import LoginForm from './Form'
import { useRouter } from 'next/navigation'

const Login = () => {
    const router = useRouter()
    const [admin, setAdmin] = useState(null)

    useEffect(() => {
        // ✅ Accès à localStorage seulement côté client
        const storedAdmin = localStorage.getItem("market1fluenceAdminID")
        setAdmin(storedAdmin)

        if (storedAdmin) {
            router.push('/articles')
        }
    }, [router])

    return (
        <Grid container sx={{ backgroundColor: "#fff" }} spacing={2}>
            <Grid
                container
                direction="row"
                justifyContent="center"
                alignItems="center"
                item
                sx={{ height: '100vh' }}
                size={12}
            >
                <Paper
                    elevation={0}
                    sx={{
                        p: 5,
                        width: 400,
                        borderWidth: 1,
                        borderColor: "black",
                        borderStyle: "solid",
                    }}
                >
                    <LoginForm />
                </Paper>
            </Grid>
        </Grid>
    )
}

export default Login
