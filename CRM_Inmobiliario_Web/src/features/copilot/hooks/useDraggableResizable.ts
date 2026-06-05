import { useState, useEffect, useRef, useCallback } from 'react';

interface UseDraggableResizableProps {
  defaultX: number;
  defaultY: number;
  defaultWidth: number;
  defaultHeight: number;
  minWidth?: number;
  minHeight?: number;
}

export function useDraggableResizable({
  defaultX,
  defaultY,
  defaultWidth,
  defaultHeight,
  minWidth = 320,
  minHeight = 400,
}: UseDraggableResizableProps) {
  const [position, setPosition] = useState({ x: defaultX, y: defaultY });
  const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight });

  const sizeRef = useRef(size);
  const posRef = useRef(position);

  useEffect(() => { sizeRef.current = size; }, [size]);
  useEffect(() => { posRef.current = position; }, [position]);

  const isDragging = useRef(false);
  const isResizing = useRef<string | null>(null);
  
  const dragStartCursor = useRef({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const startSize = useRef({ width: 0, height: 0 });

  const onDragStart = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    const target = e.target as HTMLElement;
    if (target.closest('.no-drag')) return;

    isDragging.current = true;
    dragStartCursor.current = { x: e.clientX, y: e.clientY };
    startPos.current = { ...posRef.current };
    
    if (e.pointerType === 'mouse') {
      e.preventDefault();
    }
  }, []);

  const onResizeStart = useCallback((e: React.PointerEvent, direction: string) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    isResizing.current = direction;
    dragStartCursor.current = { x: e.clientX, y: e.clientY };
    startSize.current = { ...sizeRef.current };
    startPos.current = { ...posRef.current };
    
    if (e.pointerType === 'mouse') {
      e.preventDefault();
    }
    e.stopPropagation();
  }, []);

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (isDragging.current) {
        const deltaX = e.clientX - dragStartCursor.current.x;
        const deltaY = e.clientY - dragStartCursor.current.y;
        
        let newX = startPos.current.x + deltaX;
        let newY = startPos.current.y + deltaY;

        // Limitar a los bordes de la ventana
        newX = Math.max(0, Math.min(newX, window.innerWidth - sizeRef.current.width));
        newY = Math.max(0, Math.min(newY, window.innerHeight - sizeRef.current.height));

        setPosition({ x: newX, y: newY });
      } else if (isResizing.current) {
        const deltaX = e.clientX - dragStartCursor.current.x;
        const deltaY = e.clientY - dragStartCursor.current.y;

        let newWidth = startSize.current.width;
        let newHeight = startSize.current.height;
        let newX = startPos.current.x;
        let newY = startPos.current.y;

        if (isResizing.current.includes('e')) {
          newWidth = Math.max(minWidth, startSize.current.width + deltaX);
          newWidth = Math.min(newWidth, window.innerWidth - startPos.current.x);
        }
        if (isResizing.current.includes('s')) {
          newHeight = Math.max(minHeight, startSize.current.height + deltaY);
          newHeight = Math.min(newHeight, window.innerHeight - startPos.current.y);
        }
        if (isResizing.current.includes('w')) {
          newX = Math.max(0, startPos.current.x + deltaX);
          const rightEdge = startPos.current.x + startSize.current.width;
          newWidth = Math.max(minWidth, rightEdge - newX);
          newX = rightEdge - newWidth;
        }
        if (isResizing.current.includes('n')) {
          newY = Math.max(0, startPos.current.y + deltaY);
          const bottomEdge = startPos.current.y + startSize.current.height;
          newHeight = Math.max(minHeight, bottomEdge - newY);
          newY = bottomEdge - newHeight;
        }

        setSize({ width: newWidth, height: newHeight });
        if (isResizing.current.includes('w') || isResizing.current.includes('n')) {
          setPosition({ x: newX, y: newY });
        }
      }
    };

    const onPointerUp = () => {
      isDragging.current = false;
      isResizing.current = null;
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Actualizar límites si la ventana cambia de tamaño
    const onResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - sizeRef.current.width),
        y: Math.min(prev.y, window.innerHeight - sizeRef.current.height)
      }));
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);
    };
  }, [minWidth, minHeight]);

  return {
    position,
    size,
    onDragStart,
    onResizeStart
  };
}
