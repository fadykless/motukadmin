import { Typography } from '@mui/material'
import React from 'react'

const Title = ({ children }) => {
    return (
        <Typography color='primary' variant='h3' sx={{ fontWeight: '500', mb: 1, fontSize: 17 }}>
            {children}
        </Typography>
    )
}

export default Title
