import { useEffect, useRef, useState } from 'react';

export function useFitScale(viewportWidth: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return undefined;
    }

    const update = () => {
      if (element.clientWidth > 0 && viewportWidth > 0) {
        setScale(element.clientWidth / viewportWidth);
      }
    };

    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }

    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [viewportWidth]);

  return { containerRef, scale };
}
