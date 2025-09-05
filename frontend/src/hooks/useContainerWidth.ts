import { useState, useLayoutEffect, RefObject } from 'react';

export const useContainerWidth = (ref: RefObject<HTMLElement | null>): number => {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    setWidth(element.offsetWidth);

    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setWidth(entries[0].contentRect.width);
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return width;
};