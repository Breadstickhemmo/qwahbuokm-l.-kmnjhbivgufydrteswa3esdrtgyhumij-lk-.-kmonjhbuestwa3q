import React, { useState, useEffect } from 'react';
import { Rnd, RndDragCallback, RndResizeCallback } from 'react-rnd';
import { Box, useTheme, Switch, FormControlLabel, Typography } from '@mui/material';
import TextareaAutosize from 'react-textarea-autosize';
import { SlideElement } from '../../hooks/usePresentation';
import apiClient from '../../services/apiService';

interface EditableElementProps {
  element: SlideElement;
  scale: number;
  isSelected: boolean;
  onSelect: (id: string, event?: React.MouseEvent) => void;
  onUpdate: (id: string, data: Partial<SlideElement>) => void;
  onDragStart: (id: string) => void;
  onDrag: (id: string, newPosition: { x: number, y: number }) => void;
  onDragStop: () => void;
}

const API_BASE_URL = apiClient.defaults.baseURL?.replace('/api', '');

export const EditableElement: React.FC<EditableElementProps> = ({ 
    element, scale, isSelected, onSelect, onUpdate,
    onDragStart, onDrag, onDragStop
}) => {
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(element.content || '');

  useEffect(() => { setContent(element.content || ''); }, [element.content]);

  const handleTextBlur = () => {
    setIsEditing(false);
    if (content !== element.content) { onUpdate(element.id, { content }); }
  };

  const handleToggleChange = (field: 'autoplay' | 'muted', value: boolean) => {
    onUpdate(element.id, { [field]: value });
  };
  
  const textStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    padding: '8px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: element.font_size,
    fontFamily: 'inherit',
    overflow: 'hidden',
    boxSizing: 'border-box',
    pointerEvents: 'none'
  };

  const editingStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: element.font_size,
    fontFamily: 'inherit',
    overflow: 'hidden',
    boxSizing: 'border-box',
    background: 'transparent',
    border: 'none',
    resize: 'none',
    outline: 'none',
    color: 'inherit',
    pointerEvents: 'auto',
  };
  
  const handleDrag: RndDragCallback = (e, d) => {
    onDrag(element.id, { x: d.x, y: d.y });
  };
  
  const handleDragStop: RndDragCallback = () => {
    onDragStop();
  };
  
  const onResizeStop: RndResizeCallback = (e, direction, ref, delta, position) => {
    onUpdate(element.id, {
      width: parseInt(ref.style.width, 10),
      height: parseInt(ref.style.height, 10),
      pos_x: position.x,
      pos_y: position.y,
    });
  };

  const renderContent = () => {
    if (!element.content) {
      return null;
    }

    const isExternalUrl = element.content.startsWith('http');
    const src = isExternalUrl ? element.content : `${API_BASE_URL}${element.content}`;
    
    let youtubeSrc = '';
    if (element.element_type === 'YOUTUBE_VIDEO') {
        const videoId = element.content;
        const params = new URLSearchParams();
        if (element.autoplay) params.append('autoplay', '1');
        if (element.muted) params.append('mute', '1');
        youtubeSrc = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
    }

    switch (element.element_type) {
      case 'TEXT':
        return isEditing ? (
          <TextareaAutosize onBlur={handleTextBlur} value={content} onChange={e => setContent(e.target.value)} autoFocus style={editingStyle as any} />
        ) : (
          <Box sx={textStyle}>{element.content}</Box>
        );
      case 'IMAGE':
        return (
          <img 
            src={src} 
            alt="slide element" 
            style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
            onDragStart={(e) => e.preventDefault()}
          />
        );
      case 'YOUTUBE_VIDEO':
        return (
            <iframe
                style={{ pointerEvents: isSelected ? 'none' : 'auto' }}
                width="100%"
                height="100%"
                src={youtubeSrc}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
        );
      case 'UPLOADED_VIDEO':
        return (
            <video
                src={src}
                width="100%"
                height="100%"
                controls
                autoPlay={element.autoplay}
                muted={element.muted}
                style={{ objectFit: 'contain', pointerEvents: isSelected ? 'none' : 'auto' }}
            />
        );
      case 'AUDIO':
        return (
            <audio
                src={src}
                controls
                autoPlay={element.autoplay}
                muted={element.muted}
                style={{ width: '100%', height: '100%', pointerEvents: isSelected ? 'none' : 'auto' }}
            />
        );
      default:
        return null;
    }
  };

  const renderControls = () => {
      if (!isSelected || !['YOUTUBE_VIDEO', 'UPLOADED_VIDEO', 'AUDIO'].includes(element.element_type)) {
          return null;
      }

      return (
          <Box
            sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                mt: '4px',
                p: 1,
                bgcolor: 'background.paper',
                boxShadow: 3,
                borderRadius: 1,
                zIndex: 10,
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                transform: `scale(${1 / scale})`,
                transformOrigin: 'top left',
            }}
            onClick={e => e.stopPropagation()}
          >
              <FormControlLabel
                control={<Switch size="small" checked={element.autoplay} onChange={e => handleToggleChange('autoplay', e.target.checked)} />}
                label={<Typography variant="caption">Автоплей</Typography>}
              />
               <FormControlLabel
                control={<Switch size="small" checked={element.muted} onChange={e => handleToggleChange('muted', e.target.checked)} />}
                label={<Typography variant="caption">Без звука</Typography>}
              />
          </Box>
      )
  }

  const resizeHandleStyle = {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: 'white',
    border: `1px solid ${theme.palette.primary.main}`,
  } as React.CSSProperties;

  return (
    <Rnd
      scale={scale}
      size={{ width: element.width, height: element.height }}
      position={{ x: element.pos_x, y: element.pos_y }}
      onDragStart={() => onDragStart(element.id)}
      onDrag={handleDrag}
      onDragStop={handleDragStop}
      onResizeStop={onResizeStop}
      bounds="parent"
      minWidth={100}
      minHeight={50}
      disableDragging={isEditing}
      onClick={(e: React.MouseEvent) => { 
        e.stopPropagation(); 
        onSelect(element.id, e);
      }}
      enableResizing={{
        bottom: isSelected,
        bottomLeft: isSelected,
        bottomRight: isSelected,
        left: isSelected,
        right: isSelected,
        top: isSelected,
        topLeft: isSelected,
        topRight: isSelected,
      }}
      resizeHandleComponent={{
          bottom: <div style={{...resizeHandleStyle, bottom: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize'}} />,
          bottomLeft: <div style={{...resizeHandleStyle, bottom: -4, left: -4, cursor: 'nesw-resize'}} />,
          bottomRight: <div style={{...resizeHandleStyle, bottom: -4, right: -4, cursor: 'nwse-resize'}} />,
          left: <div style={{...resizeHandleStyle, top: '50%', left: -4, transform: 'translateY(-50%)', cursor: 'ew-resize'}} />,
          right: <div style={{...resizeHandleStyle, top: '50%', right: -4, transform: 'translateY(-50%)', cursor: 'ew-resize'}} />,
          top: <div style={{...resizeHandleStyle, top: -4, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize'}} />,
          topLeft: <div style={{...resizeHandleStyle, top: -4, left: -4, cursor: 'nwse-resize'}} />,
          topRight: <div style={{...resizeHandleStyle, top: -4, right: -4, cursor: 'nesw-resize'}} />,
      }}
    >
      <Box
        onDoubleClick={() => element.element_type === 'TEXT' && setIsEditing(true)}
        sx={{
          width: '100%',
          height: '100%',
          border: '2px solid',
          borderColor: isSelected ? 'primary.main' : 'transparent',
          boxSizing: 'border-box',
          position: 'relative',
          bgcolor: element.element_type.includes('VIDEO') ? 'black' : 'transparent',
        }}
      >
        {renderContent()}
        {renderControls()}
      </Box>
    </Rnd>
  );
};