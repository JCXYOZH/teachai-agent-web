import { useEffect, useRef, useState } from 'react';

export function useFitScale(viewportWidth: number, viewportHeight: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }

    const update = () => {
      const width = element.clientWidth;
      if (width <= 0 || viewportWidth <= 0) {
        return;
      }
      const widthScale = width / viewportWidth;
      const height = element.clientHeight;
      const heightScale =
        viewportHeight > 0 && height > 0 ? height / viewportHeight : widthScale;
      setScale(Math.min(widthScale, heightScale));
    };

    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }

    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [viewportHeight, viewportWidth]);

  return { containerRef, scale };
}