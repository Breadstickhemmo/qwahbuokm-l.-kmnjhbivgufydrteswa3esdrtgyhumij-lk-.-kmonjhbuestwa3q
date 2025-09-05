import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

interface ImageUploadProps {
  initialImageUrl: string | null;
  onUpload: (file: File) => Promise<void>;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ initialImageUrl, onUpload }) => {
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => {
        setStatus('idle');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('loading');
    try {
      await onUpload(file);
      setImageUrl(URL.createObjectURL(file));
      setStatus('success');
    } catch (e) {
      setStatus('error');
    }
  };

  const statusIcon = {
    loading: <CircularProgress size={24} color="inherit" />,
    success: <CheckCircleIcon color="success" />,
    error: <ErrorIcon color="error" />,
    idle: <PhotoCamera />,
  };

  return (
    <Box
      onClick={() => fileInputRef.current?.click()}
      sx={{
        width: 100,
        height: 60,
        border: '2px dashed',
        borderColor: 'grey.400',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        bgcolor: 'grey.100',
        position: 'relative',
        overflow: 'hidden',
        '&:hover .overlay': {
          opacity: 1,
        },
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/gif"
        hidden
        onChange={handleFileChange}
      />
      {imageUrl ? (
        <img src={imageUrl.startsWith('blob:') ? imageUrl : `http://127.0.0.1:5000${imageUrl}`} alt="Превью" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <Typography variant="caption" color="textSecondary">Нет фото</Typography>
      )}
      <Box
        className="overlay"
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          bgcolor: 'rgba(0,0,0,0.5)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: status !== 'idle' ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
      >
        {statusIcon[status]}
      </Box>
    </Box>
  );
};