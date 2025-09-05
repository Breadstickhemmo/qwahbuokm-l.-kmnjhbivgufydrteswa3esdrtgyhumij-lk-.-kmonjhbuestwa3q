import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Slide, SlideElement } from '../../hooks/usePresentation';
import { EditableElement } from './EditableElement';
import apiClient from '../../services/apiService';

interface SlideEditorProps {
  slide: Slide | null;
  scale: number;
  selectedElementIds: string[];
  draftPositions: Record<string, { x: number, y: number }>;
  onSelectElement: (id: string | null, event?: React.MouseEvent) => void;
  onUpdateElement: (id: string, data: Partial<SlideElement>) => void;
  onMouseDown: (event: React.MouseEvent) => void;
  onDragStart: (id: string) => void;
  onDrag: (id: string, newPosition: { x: number, y: number }) => void;
  onDragStop: () => void;
}

const API_BASE_URL = apiClient.defaults.baseURL?.replace('/api', '');

export const SlideEditor = React.forwardRef<HTMLDivElement, SlideEditorProps>(({ 
    slide, scale, selectedElementIds, draftPositions, onSelectElement, onUpdateElement,
    onMouseDown, onDragStart, onDrag, onDragStop
}, ref) => {
  if (!slide) {
    return (
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">Выберите слайд для редактирования</Typography>
      </Box>
    );
  }

  return (
    <Paper
      ref={ref}
      elevation={3}
      onMouseDown={onMouseDown}
      sx={{
        width: 1280,
        height: 720,
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        backgroundColor: slide.background_image ? 'transparent' : slide.background_color,
        backgroundImage: slide.background_image ? `url(${API_BASE_URL}${slide.background_image})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {slide.elements.map(element => {
        const draftPosition = draftPositions[element.id];
        const finalElement = draftPosition 
          ? { ...element, pos_x: draftPosition.x, pos_y: draftPosition.y } 
          : element;

        return (
          <EditableElement 
            key={element.id} 
            element={finalElement}
            scale={scale}
            isSelected={selectedElementIds.includes(element.id)}
            onSelect={onSelectElement}
            onUpdate={onUpdateElement}
            onDragStart={onDragStart}
            onDrag={onDrag}
            onDragStop={onDragStop}
          />
        );
      })}
    </Paper>
  );
});