import { Box, Button, IconButton, List, ListItem, ListItemIcon, ListItemText } from '@mui/material'
import React from 'react'

const Breadcrumb = ({ path, icon }) => {
    return (
        <Button color='inherit' startIcon={icon}>
            {path}
        </Button>
    )
}

export default Breadcrumb
