import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiService';
import { Box } from '@mui/material';

interface AuthenticatedImageProps {
  src: string;
}

export const AuthenticatedImage: React.FC<AuthenticatedImageProps> = ({ src }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    let url: string | null = null;
    const fetchImage = async () => {
      try {
        const response = await apiClient.get(src, { responseType: 'blob' });
        url = URL.createObjectURL(response.data);
        setImgSrc(url);
      } catch (err) {
        console.error("Failed to load authenticated image", err);
        setError(true);
      }
    };
    fetchImage();

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [src]);

  if (error || !imgSrc) {
    return <Box sx={{ width: '100%', height: '100%', backgroundColor: '#fff' }} />;
  }

  return <img src={imgSrc} alt="Presentation thumbnail" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
};