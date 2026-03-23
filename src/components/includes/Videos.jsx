import { Typography } from '@mui/material'
import React from 'react'

const Videos = ({ youtubeVideoID }) => {
    return (
        <Typography textAlign={'center'}>
            <iframe
                width="225"
                height="400"
                src={"https://youtube.com/embed/" + youtubeVideoID}
                style={{ border: 0 }}
                title={"Video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
        </Typography>
    )
}

export default Videos