import React, { useState, useEffect } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { Box, Typography } from '@mui/material';

interface EditableTextProps {
  initialValue: string;
  onSave: (value: string) => void;
  placeholder: string;
  variant: 'h3' | 'body1';
}

export const EditableText: React.FC<EditableTextProps> = ({ initialValue, onSave, placeholder, variant }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== initialValue) {
      onSave(value);
    }
  };

  const textStyles = {
    h3: { fontSize: '2.5rem', fontWeight: 'bold' },
    body1: { fontSize: '1.2rem' },
  };

  if (isEditing) {
    return (
      <TextareaAutosize
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        autoFocus
        style={{
          ...textStyles[variant],
          width: '100%',
          border: 'none',
          outline: 'none',
          resize: 'none',
          background: 'transparent',
          padding: 0,
          fontFamily: 'inherit',
          color: 'inherit',
        }}
      />
    );
  }

  return (
    <Box onClick={() => setIsEditing(true)} sx={{ width: '100%', minHeight: '1.5em', cursor: 'text' }}>
      <Typography 
        variant={variant} 
        sx={{ 
          ...textStyles[variant], 
          color: value ? 'inherit' : 'text.secondary',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {value || placeholder}
      </Typography>
    </Box>
  );
};