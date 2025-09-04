import React, { useRef, useState, useLayoutEffect, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Box, CircularProgress, Typography, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, Tabs, Tab, styled } from '@mui/material';
import { usePresentation, SlideElement } from '../hooks/usePresentation';
import { SlideList } from '../components/EditorPage/SlideList';
import { SlideEditor } from '../components/EditorPage/SlideEditor';
import { EditorToolbar } from '../components/EditorPage/EditorToolbar';
import { AiChatPanel } from '../components/EditorPage/AiChatPanel';
import apiClient from '../services/apiService';
import { useNotification } from '../context/NotificationContext';

const BASE_WIDTH = 1280;
const BASE_HEIGHT = 720;

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

export const EditorPage = () => {
  const { presentationId } = useParams<{ presentationId: string }>();
  const { showNotification } = useNotification();
  const { 
    presentation, loading, activeSlide, 
    handleSelectSlide, handleAddSlide, handleDeleteSlide, handleRenamePresentation,
    handleReorderSlides,
    handleAddElement, handleUpdateElement, handleDeleteElement, handleUpdateMultipleElements
  } = usePresentation(presentationId);

  const containerRef = useRef<HTMLDivElement>(null);
  const slideEditorRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoModalTab, setVideoModalTab] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [isDrawingSelection, setIsDrawingSelection] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  const [dragStartPositions, setDragStartPositions] = useState<Record<string, {x: number, y: number}>>({});
  const [draftPositions, setDraftPositions] = useState<Record<string, {x: number, y: number}>>({});

  const handleSelectElement = useCallback((elementId: string | null, event?: React.MouseEvent) => {
    if (event?.shiftKey && elementId) {
      setSelectedElementIds(prevIds => 
        prevIds.includes(elementId) 
          ? prevIds.filter(id => id !== elementId)
          : [...prevIds, elementId]
      );
    } else {
      setSelectedElementIds(elementId ? [elementId] : []);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (['TEXTAREA', 'INPUT'].includes(target.tagName)) {
        return;
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElementIds.length > 0) {
        selectedElementIds.forEach(id => handleDeleteElement(id));
        setSelectedElementIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, handleDeleteElement]);

  useEffect(() => {
    setSelectedElementIds([]);
  }, [activeSlide]);

  const handleOpenRename = () => {
    if (presentation) {
      setNewTitle(presentation.title);
      setIsRenameOpen(true);
    }
  };
  
  const handleCloseRename = () => setIsRenameOpen(false);

  const handleSaveRename = async () => {
    await handleRenamePresentation(newTitle);
    handleCloseRename();
  };

  const handleOpenVideoModal = () => setIsVideoModalOpen(true);
  const handleCloseVideoModal = () => {
    setIsVideoModalOpen(false);
    setVideoUrl('');
    setVideoModalTab(0);
    setIsUploading(false);
  }

  const handleAddYoutubeVideo = () => {
    if(videoUrl) {
        handleAddElement('YOUTUBE_VIDEO', videoUrl);
    }
    handleCloseVideoModal();
  }

  const handleVideoFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    try {
        const response = await apiClient.post('/upload/video', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        handleAddElement('UPLOADED_VIDEO', response.data.url);
        handleCloseVideoModal();
    } catch (error) {
        showNotification('Не удалось загрузить видео', 'error');
        setIsUploading(false);
    }
  };

  const isElementInSelection = (element: SlideElement, selection: { x: number; y: number; width: number; height: number }): boolean => {
    const elementRect = {
        x: element.pos_x,
        y: element.pos_y,
        width: element.width,
        height: element.height
    };
    return (
        elementRect.x < selection.x + selection.width &&
        elementRect.x + elementRect.width > selection.x &&
        elementRect.y < selection.y + selection.height &&
        elementRect.y + elementRect.height > selection.y
    );
  };
  
  const handleMouseDown = (event: React.MouseEvent) => {
    if (event.target !== slideEditorRef.current) return;
    event.preventDefault();
    handleSelectElement(null);
    setIsDrawingSelection(true);
    const rect = slideEditorRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;
    setSelectionStart({ x, y });
  };
  
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDrawingSelection || !selectionStart) return;
    event.preventDefault();
    const rect = slideEditorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const currentX = (event.clientX - rect.left) / scale;
    const currentY = (event.clientY - rect.top) / scale;
    const x = Math.min(currentX, selectionStart.x);
    const y = Math.min(currentY, selectionStart.y);
    const width = Math.abs(currentX - selectionStart.x);
    const height = Math.abs(currentY - selectionStart.y);
    setSelectionRect({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (isDrawingSelection && selectionRect) {
      const selectedIds = activeSlide?.elements
        .filter(element => isElementInSelection(element, selectionRect))
        .map(element => element.id) || [];
      setSelectedElementIds(selectedIds);
    }
    setIsDrawingSelection(false);
    setSelectionStart(null);
    setSelectionRect(null);
  };
  
  const handleDragStart = (elementId: string) => {
    const elements = activeSlide?.elements;
    if (!elements) return;

    const idsToDrag = selectedElementIds.includes(elementId) ? selectedElementIds : [elementId];
    if (!selectedElementIds.includes(elementId)) {
        setSelectedElementIds([elementId]);
    }
    
    const positions: Record<string, {x: number, y: number}> = {};
    elements.forEach(el => {
        if (idsToDrag.includes(el.id)) {
            positions[el.id] = { x: el.pos_x, y: el.pos_y };
        }
    });
    setDragStartPositions(positions);
    setDraftPositions(positions);
  };

  const handleDrag = (draggedElementId: string, newPosition: { x: number, y: number }) => {
    const startPos = dragStartPositions[draggedElementId];
    if (!startPos) return;

    const totalDeltaX = newPosition.x - startPos.x;
    const totalDeltaY = newPosition.y - startPos.y;

    const newDraftPositions: Record<string, {x: number, y: number}> = {};
    Object.keys(dragStartPositions).forEach(id => {
        newDraftPositions[id] = {
            x: dragStartPositions[id].x + totalDeltaX,
            y: dragStartPositions[id].y + totalDeltaY
        };
    });
    setDraftPositions(newDraftPositions);
  };

  const handleDragStop = () => {
    if (Object.keys(draftPositions).length === 0) return;

    const updatesToSave: Record<string, Partial<SlideElement>> = {};
    Object.keys(draftPositions).forEach(id => {
        updatesToSave[id] = {
            pos_x: draftPositions[id].x,
            pos_y: draftPositions[id].y
        };
    });
    
    handleUpdateMultipleElements(updatesToSave, true);
    
    setDragStartPositions({});
    setDraftPositions({});
  };

  useLayoutEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const scaleX = width / BASE_WIDTH;
        const scaleY = height / BASE_HEIGHT;
        setScale(Math.min(scaleX, scaleY) * 0.95);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [presentation]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 112px)' }}><CircularProgress /></Box>;
  }

  if (!presentation) {
    return <Typography sx={{ p: 3 }}>Презентация не найдена или у вас нет к ней доступа.</Typography>;
  }

  return (
    <>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
        <EditorToolbar 
          title={presentation.title} 
          presentationId={presentation.id} 
          onRenameClick={handleOpenRename} 
          onAddElement={handleAddElement}
          onAddVideoClick={handleOpenVideoModal}
        />
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} >
          <SlideList
            slides={presentation.slides}
            activeSlideId={activeSlide?.id || null}
            onSelectSlide={handleSelectSlide}
            onAddSlide={handleAddSlide}
            onDeleteSlide={handleDeleteSlide}
            onReorderSlides={handleReorderSlides}
          />
          <Box 
            ref={containerRef}
            sx={{ flexGrow: 1, backgroundColor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
          >
            <Box sx={{ transform: `scale(${scale})`, transformOrigin: 'center center', position: 'relative' }}>
              <SlideEditor 
                ref={slideEditorRef}
                slide={activeSlide}
                scale={scale}
                selectedElementIds={selectedElementIds}
                draftPositions={draftPositions}
                onSelectElement={handleSelectElement}
                onUpdateElement={handleUpdateElement}
                onMouseDown={handleMouseDown}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragStop={handleDragStop}
              />
              {isDrawingSelection && selectionRect && (
                <Box
                  sx={{
                    position: 'absolute',
                    border: '1px solid',
                    borderColor: 'primary.main',
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    left: selectionRect.x,
                    top: selectionRect.y,
                    width: selectionRect.width,
                    height: selectionRect.height,
                    pointerEvents: 'none',
                    transformOrigin: 'top left',
                  }}
                />
              )}
            </Box>
          </Box>
          <AiChatPanel />
        </Box>
      </Box>
      <Dialog open={isRenameOpen} onClose={handleCloseRename} fullWidth maxWidth="xs">
        <DialogTitle>Переименовать презентацию</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название презентации"
            type="text"
            fullWidth
            variant="standard"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSaveRename()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRename}>Отмена</Button>
          <Button onClick={handleSaveRename}>Сохранить</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={isVideoModalOpen} onClose={handleCloseVideoModal} fullWidth maxWidth="sm">
        <DialogTitle>Добавить видео</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Tabs value={videoModalTab} onChange={(_, newValue) => setVideoModalTab(newValue)} centered>
                <Tab label="YouTube" />
                <Tab label="Загрузить файл" />
            </Tabs>
            {videoModalTab === 0 && (
                <TextField
                    autoFocus
                    margin="dense"
                    label="Ссылка на видео"
                    type="url"
                    fullWidth
                    variant="standard"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddYoutubeVideo()}
                />
            )}
            {videoModalTab === 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, border: '2px dashed grey', borderRadius: 2 }}>
                    <Button
                        component="label"
                        variant="contained"
                        disabled={isUploading}
                    >
                        {isUploading ? <CircularProgress size={24} /> : 'Выбрать видеофайл'}
                        <VisuallyHiddenInput type="file" accept="video/mp4,video/webm" onChange={handleVideoFileUpload} />
                    </Button>
                </Box>
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={handleCloseVideoModal}>Отмена</Button>
            {videoModalTab === 0 && <Button onClick={handleAddYoutubeVideo}>Добавить</Button>}
        </DialogActions>
    </Dialog>
    </>
  );
};