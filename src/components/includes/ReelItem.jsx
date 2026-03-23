import { Box, CardMedia, Typography, useTheme } from '@mui/material'
import React from 'react'
import moment from 'moment'
import 'moment/locale/fr'
import { getYouTubeShortsID } from '@/functions'

const ReelItem = ({ article }) => {
    return (
        <Box>
            <Typography textAlign={'center'}>
                <div style={{ position: 'relative', width: '100%', maxWidth: 320, aspectRatio: '9 / 16', margin: '0 auto', borderRadius: 12, overflow: 'hidden' }}>
                    <iframe
                        src={'https://youtube.com/embed/' + getYouTubeShortsID(article?.short || article?.url)}
                        title={article.title}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: 0,
                        }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>

                <Typography color='primary' fontWeight={'600'} fontSize={17} variant='h6' >{article.title}</Typography>
            </Typography>
        </Box>
    )
}

export default ReelItem