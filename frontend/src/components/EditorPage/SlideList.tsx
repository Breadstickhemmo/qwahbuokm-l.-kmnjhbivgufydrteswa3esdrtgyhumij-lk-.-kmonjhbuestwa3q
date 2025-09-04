import React from 'react';
import { Box, List, Typography, Paper, Divider, Button, IconButton, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SlidePreview } from './SlidePreview';
import { Slide } from '../../hooks/usePresentation';

interface SlideListProps {
  slides: Slide[];
  activeSlideId: number | null;
  onSelectSlide: (id: number) => void;
  onAddSlide: () => void;
  onDeleteSlide: (id: number) => void;
  onReorderSlides: (reorderedSlides: Slide[]) => void;
}

const THUMBNAIL_WIDTH = 140;
const BASE_SLIDE_WIDTH = 1280;
const SCALE_FACTOR = THUMBNAIL_WIDTH / BASE_SLIDE_WIDTH;

const SortableSlideItem = ({ slide, index, activeSlideId, onSelectSlide, onDeleteSlide }: { slide: Slide; index: number; activeSlideId: number | null; onSelectSlide: (id: number) => void; onDeleteSlide: (id: number) => void; }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: slide.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners} sx={{ mb: 2, position: 'relative', touchAction: 'none', '& .delete-button': { opacity: 0 }, '&:hover .delete-button': { opacity: 1 } }}>
       <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
        <Typography sx={{ mr: 2, color: 'text.secondary', fontSize: '0.8rem' }}>{index + 1}</Typography>
        <Box 
          onClick={() => onSelectSlide(slide.id)}
          sx={{ 
            flexGrow: 1, cursor: 'pointer',
            border: `solid ${slide.id === activeSlideId ? 2 : 1}px`,
            borderColor: slide.id === activeSlideId ? 'primary.main' : 'divider',
            aspectRatio: '16 / 9',
            overflow: 'hidden',
            display: 'block',
          }}
        >
          <Box sx={{
            transform: `scale(${SCALE_FACTOR})`,
            transformOrigin: 'top left',
            width: BASE_SLIDE_WIDTH,
            height: BASE_SLIDE_WIDTH * (9 / 16),
          }}>
            <SlidePreview slide={slide} />
          </Box>
        </Box>
      </Box>
      <Tooltip title="Удалить слайд">
        <IconButton className="delete-button" size="small" onClick={(e) => { e.stopPropagation(); onDeleteSlide(slide.id); }} sx={{ position: 'absolute', top: -5, right: -5, bgcolor: 'background.paper', transition: 'opacity 0.2s', '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' } }}>
          <DeleteIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};


export const SlideList: React.FC<SlideListProps> = ({ slides, activeSlideId, onSelectSlide, onAddSlide, onDeleteSlide, onReorderSlides }) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex((s) => s.id === active.id);
      const newIndex = slides.findIndex((s) => s.id === over.id);
      const reorderedSlides = arrayMove(slides, oldIndex, newIndex);
      onReorderSlides(reorderedSlides);
    }
  };

  return (
    <Paper elevation={0} sx={{ width: 200, height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <List sx={{ overflowY: 'auto', flexGrow: 1, p: 2 }}>
            {slides.map((slide, index) => (
              <SortableSlideItem 
                key={slide.id}
                slide={slide}
                index={index}
                activeSlideId={activeSlideId}
                onSelectSlide={onSelectSlide}
                onDeleteSlide={onDeleteSlide}
              />
            ))}
          </List>
        </SortableContext>
      </DndContext>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Button fullWidth startIcon={<AddIcon />} onClick={onAddSlide}>Новый слайд</Button>
      </Box>
    </Paper>
  );
};