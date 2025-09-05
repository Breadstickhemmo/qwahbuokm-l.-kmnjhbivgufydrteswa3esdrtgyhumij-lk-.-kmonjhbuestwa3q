import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiService';
import { useNotification } from '../context/NotificationContext';
import { useDebounce } from './useDebounce';

export interface SlideElement {
  id: string;
  element_type: 'TEXT' | 'IMAGE' | 'YOUTUBE_VIDEO' | 'UPLOADED_VIDEO';
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  content: string | null;
  font_size: number;
  thumbnailUrl?: string;
}

export interface Slide {
  id: number;
  slide_number: number;
  background_color: string;
  background_image: string | null;
  elements: SlideElement[];
}

export interface PresentationData {
  id: string;
  title: string;
  slides: Slide[];
}

export const usePresentation = (presentationId?: string) => {
  const [presentation, setPresentation] = useState<PresentationData | null>(null);
  const [activeSlide, setActiveSlide] = useState<Slide | null>(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, Partial<SlideElement>>>({});
  const debouncedUpdates = useDebounce(pendingUpdates, 500);

  const fetchPresentation = useCallback(async () => {
    if (!presentationId) return;
    try {
      setLoading(true);
      const response = await apiClient.get<PresentationData>(`/presentations/${presentationId}`);
      setPresentation(response.data);
      if (response.data.slides.length > 0) {
        setActiveSlide(response.data.slides[0]);
      }
    } catch (error) {
      showNotification('Не удалось загрузить презентацию', 'error');
    } finally {
      setLoading(false);
    }
  }, [presentationId, showNotification]);

  useEffect(() => {
    fetchPresentation();
  }, [fetchPresentation]);

  const updatePresentationState = useCallback((updateFunc: (prev: PresentationData | null) => PresentationData | null) => {
    setPresentation(prev => {
        const newState = updateFunc(prev);
        if (newState && activeSlide) {
            const newActiveSlide = newState.slides.find(s => s.id === activeSlide.id) || null;
            setActiveSlide(newActiveSlide);
        }
        return newState;
    });
  }, [activeSlide]);

  useEffect(() => {
    const savePendingUpdates = async () => {
        if (Object.keys(debouncedUpdates).length === 0) return;

        const updatesToSave = { ...debouncedUpdates };
        setPendingUpdates({});

        try {
            await Promise.all(
                Object.entries(updatesToSave).map(([id, data]) => 
                    apiClient.put(`/elements/${id}`, data)
                )
            );
        } catch (error) {
            showNotification('Ошибка сохранения элементов', 'error');
        }
    };

    savePendingUpdates();
  }, [debouncedUpdates, showNotification]);

  const handleUpdateMultipleElements = useCallback((updates: Record<string, Partial<SlideElement>>, saveImmediately: boolean) => {
    if (!activeSlide) return;

    updatePresentationState(prev => {
        if (!prev) return null;
        const newSlides = prev.slides.map(s => {
            if (s.id === activeSlide.id) {
                return {
                    ...s,
                    elements: s.elements.map(e => updates[e.id] ? { ...e, ...updates[e.id] } : e)
                };
            }
            return s;
        });
        return { ...prev, slides: newSlides };
    });

    if (saveImmediately) {
        Object.entries(updates).forEach(async ([id, data]) => {
            try {
                await apiClient.put(`/elements/${id}`, data);
            } catch (error) {
                showNotification('Ошибка сохранения элемента', 'error');
            }
        });
    } else {
        setPendingUpdates(prev => ({...prev, ...updates}));
    }
  }, [activeSlide, showNotification, updatePresentationState]);

  const handleUpdateElement = useCallback((elementId: string, data: Partial<SlideElement>) => {
    handleUpdateMultipleElements({ [elementId]: data }, true);
  }, [handleUpdateMultipleElements]);

  const handleSelectSlide = (id: number) => {
    const slide = presentation?.slides.find(s => s.id === id);
    if (slide) setActiveSlide(slide);
  };

  const handleAddSlide = async () => {
    if (!presentationId) return;
    try {
      const response = await apiClient.post(`/presentations/${presentationId}/slides`);
      const newSlide = response.data;
      updatePresentationState(prev => prev ? { ...prev, slides: [...prev.slides, newSlide] } : null);
      setActiveSlide(newSlide);
      showNotification('Слайд добавлен', 'success');
    } catch (error) {
      showNotification('Не удалось добавить слайд', 'error');
    }
  };

  const handleDeleteSlide = async (slideId: number) => {
    if (!presentation) return;
    try {
      await apiClient.delete(`/slides/${slideId}`);
      showNotification('Слайд удален', 'success');

      const oldSlides = presentation.slides;
      const slideToDeleteIndex = oldSlides.findIndex(s => s.id === slideId);
      
      const newSlides = oldSlides.filter(s => s.id !== slideId);

      let newActiveSlide: Slide | null = activeSlide;
      if (activeSlide?.id === slideId) {
        if (newSlides.length === 0) {
          newActiveSlide = null;
        } else {
          const newActiveIndex = Math.max(0, slideToDeleteIndex -1);
          newActiveSlide = newSlides[newActiveIndex];
        }
      }
      
      setPresentation({ ...presentation, slides: newSlides });
      setActiveSlide(newActiveSlide);

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Не удалось удалить слайд';
      showNotification(errorMessage, 'error');
    }
  };
  
  const handleReorderSlides = useCallback(async (reorderedSlides: Slide[]) => {
    if (!presentation) return;

    const originalSlides = presentation.slides;
    updatePresentationState(prev => prev ? { ...prev, slides: reorderedSlides } : null);

    const slideIds = reorderedSlides.map(s => s.id);
    try {
      await apiClient.put(`/presentations/${presentation.id}/slides/reorder`, { slide_ids: slideIds });
    } catch (error) {
      showNotification('Не удалось сохранить порядок', 'error');
      updatePresentationState(prev => prev ? { ...prev, slides: originalSlides } : null);
    }
  }, [presentation, showNotification, updatePresentationState]);


  const handleRenamePresentation = useCallback(async (newTitle: string) => {
    if (!presentation) return;
    try {
      await apiClient.put(`/presentations/${presentation.id}`, { title: newTitle });
      updatePresentationState(prev => prev ? { ...prev, title: newTitle } : null);
      showNotification('Презентация переименована', 'success');
    } catch (error) {
      showNotification('Не удалось переименовать', 'error');
    }
  }, [presentation, showNotification, updatePresentationState]);


  const handleAddElement = async (type: SlideElement['element_type'], content?: string) => {
    if (!activeSlide) return;
  
    let newElementData;
    const defaultSize = { width: 400, height: 225 };

    switch (type) {
      case 'TEXT':
        newElementData = { element_type: type, content: 'Новый текст', width: 400, height: 150 };
        break;
      case 'IMAGE':
      case 'YOUTUBE_VIDEO':
      case 'UPLOADED_VIDEO':
        newElementData = { element_type: type, content: content, ...defaultSize };
        break;
      default:
        return;
    }
  
    try {
      const response = await apiClient.post(`/slides/${activeSlide.id}/elements`, newElementData);
      const createdElement = response.data;
      
      updatePresentationState(prev => {
        if (!prev) return null;
        const newSlides = prev.slides.map(s => s.id === activeSlide.id ? { ...s, elements: [...s.elements, createdElement] } : s);
        return { ...prev, slides: newSlides };
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Не удалось добавить элемент';
      showNotification(errorMessage, 'error');
    }
  };

  const handleDeleteElement = useCallback(async (elementId: string) => {
    if (!activeSlide) return;
    try {
      await apiClient.delete(`/elements/${elementId}`);
      updatePresentationState(prev => {
        if (!prev) return null;
        const newSlides = prev.slides.map(s => s.id === activeSlide.id ? { ...s, elements: s.elements.filter(e => e.id !== elementId) } : s);
        return { ...prev, slides: newSlides };
      });
    } catch (error) { showNotification('Не удалось удалить элемент', 'error'); }
  }, [activeSlide, showNotification, updatePresentationState]);

  const handleUpdateSlideBackgroundLocal = useCallback((slideId: number, background: { backgroundColor?: string; backgroundImage?: string | null }) => {
    updatePresentationState(prev => {
      if (!prev) return null;
      const newSlides = prev.slides.map(s => {
          if (s.id === slideId) {
            if (background.backgroundColor) {
                return { ...s, background_color: background.backgroundColor, background_image: null };
            }
            if (background.hasOwnProperty('backgroundImage')) {
                return { ...s, background_image: background.backgroundImage ?? null };
            }
          }
          return s;
      });
      return { ...prev, slides: newSlides };
    });
  }, [updatePresentationState]);

  const handleUpdateSlideBackground = useCallback(async (slideId: number, background: { backgroundColor?: string; backgroundImage?: string | null }) => {
    if (!presentation) return;

    const originalSlides = presentation.slides;
    handleUpdateSlideBackgroundLocal(slideId, background);
    
    try {
      const payload = background.hasOwnProperty('backgroundImage')
        ? { background_image: background.backgroundImage }
        : { background_color: background.backgroundColor };
      
      await apiClient.put(`/slides/${slideId}`, payload);
    } catch (error) {
      showNotification('Не удалось обновить фон', 'error');
      updatePresentationState(prev => prev ? { ...prev, slides: originalSlides } : null);
    }
  }, [presentation, showNotification, updatePresentationState, handleUpdateSlideBackgroundLocal]);

  return { 
    presentation, loading, activeSlide, 
    handleSelectSlide, handleAddSlide, handleDeleteSlide, handleRenamePresentation,
    handleReorderSlides,
    handleAddElement, handleUpdateElement, handleDeleteElement, handleUpdateMultipleElements,
    handleUpdateSlideBackground,
    handleUpdateSlideBackgroundLocal,
  };
};