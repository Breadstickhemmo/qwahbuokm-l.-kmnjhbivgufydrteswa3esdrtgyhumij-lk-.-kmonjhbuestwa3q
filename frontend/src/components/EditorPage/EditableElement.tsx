import React, { useState, useEffect } from 'react';
import { Rnd, RndDragCallback, RndResizeCallback } from 'react-rnd';
import { Box, useTheme } from '@mui/material';
import TextareaAutosize from 'react-textarea-autosize';
import { SlideElement } from '../../hooks/usePresentation';

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
  
  const handleDragStop: RndDragCallback = (e, d) => {
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
    switch (element.element_type) {
      case 'TEXT':
        return isEditing ? (
          <TextareaAutosize onBlur={handleTextBlur} value={content} onChange={e => setContent(e.target.value)} autoFocus style={editingStyle as any} />
        ) : (
          <Box sx={textStyle}>{element.content}</Box>
        );
      case 'IMAGE':
        return element.content ? (
          <img 
            src={element.content} 
            alt="slide element" 
            style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
            onDragStart={(e) => e.preventDefault()}
          />
        ) : null;
      case 'YOUTUBE_VIDEO':
        const videoId = element.content;
        const embedSrc = `https://www.youtube.com/embed/${videoId}`;
        return (
            <iframe
                style={{ pointerEvents: isSelected ? 'none' : 'auto' }}
                width="100%"
                height="100%"
                src={embedSrc}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
        );
      case 'UPLOADED_VIDEO':
        return element.content ? (
            <video
                src={element.content}
                width="100%"
                height="100%"
                controls
                style={{ objectFit: 'contain', pointerEvents: isSelected ? 'none' : 'auto' }}
            />
        ) : null;
      default:
        return null;
    }
  };

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
      </Box>
    </Rnd>
  );
};