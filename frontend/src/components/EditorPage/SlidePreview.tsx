import React, { useState, useEffect } from 'react';
import { Paper, Box, CircularProgress } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { Slide, SlideElement } from '../../hooks/usePresentation';
import apiClient from '../../services/apiService';

const ElementPreview: React.FC<{ element: SlideElement }> = ({ element }) => {
    const [thumb, setThumb] = useState<string | null>(null);
    const [loadingThumb, setLoadingThumb] = useState(false);

    useEffect(() => {
        if (element.element_type === 'UPLOADED_VIDEO' && element.content && !thumb) {
            setLoadingThumb(true);
            const video = document.createElement('video');
            video.src = element.content;
            video.crossOrigin = "anonymous";
            video.onloadedmetadata = () => {
                video.currentTime = 1;
            };
            video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                setThumb(canvas.toDataURL());
                setLoadingThumb(false);
            };
            video.onerror = () => {
                setLoadingThumb(false);
            }
        }
    }, [element.content, element.element_type, thumb]);

    let content;

    switch(element.element_type) {
        case 'IMAGE':
            content = element.content ? (
                <img 
                    src={element.content} 
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
            ) : null;
            break;
        case 'YOUTUBE_VIDEO':
            content = element.thumbnailUrl ? (
                <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: 'black' }}>
                    <img 
                        src={element.thumbnailUrl}
                        alt="video thumbnail"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                    />
                    <PlayCircleOutlineIcon sx={{ 
                        position: 'absolute', top: '50%', left: '50%', 
                        transform: 'translate(-50%, -50%)', fontSize: '4rem', color: 'white'
                    }} />
                </Box>
            ) : null;
            break;
        case 'UPLOADED_VIDEO':
            content = (
                <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {loadingThumb && <CircularProgress size={30} color="inherit" sx={{color: 'white'}} />}
                    {thumb && (
                        <img 
                            src={thumb}
                            alt="video thumbnail"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                        />
                    )}
                    <PlayCircleOutlineIcon sx={{ 
                        position: 'absolute', top: '50%', left: '50%', 
                        transform: 'translate(-50%, -50%)', fontSize: '4rem', color: 'white'
                    }} />
                </Box>
            );
            break;
        case 'AUDIO':
            content = (
                 <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.200', borderRadius: 1 }}>
                    <MusicNoteIcon sx={{ fontSize: '2.5rem', color: 'text.secondary' }} />
                </Box>
            );
            break;
        case 'TEXT':
        default:
            content = (
                <Box
                    sx={{
                        width: '100%', height: '100%', whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word', fontSize: element.font_size,
                        overflow: 'hidden', p: '8px'
                    }}
                >
                    {element.content}
                </Box>
            );
            break;
    }

    return (
        <Box
            sx={{
                position: 'absolute', left: element.pos_x, top: element.pos_y,
                width: element.width, height: element.height, boxSizing: 'border-box'
            }}
        >
            {content}
        </Box>
    );
};

const API_BASE_URL = apiClient.defaults.baseURL?.replace('/api', '');

export const SlidePreview: React.FC<{ slide: Slide }> = ({ slide }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        width: 1280,
        height: 720,
        position: 'relative',
        overflow: 'hidden',
        pointerEvents: 'none',
        backgroundColor: slide.background_image ? 'transparent' : slide.background_color,
        backgroundImage: slide.background_image ? `url(${API_BASE_URL}${slide.background_image})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {slide.elements.map(element => (
        <ElementPreview key={element.id} element={element} />
      ))}
    </Paper>
  );
};