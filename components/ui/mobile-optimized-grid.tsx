'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, Grip } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GridItem {
  id: string;
  component: React.ReactNode;
  span?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  priority?: number; // Higher priority items appear first on mobile
}

interface MobileOptimizedGridProps {
  items: GridItem[];
  className?: string;
  enableSwipe?: boolean;
  enableReorder?: boolean;
  onReorder?: (items: GridItem[]) => void;
}

export function MobileOptimizedGrid({ 
  items, 
  className = '', 
  enableSwipe = true,
  enableReorder = false,
  onReorder 
}: MobileOptimizedGridProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [orderedItems, setOrderedItems] = useState(items);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setOrderedItems(items);
  }, [items]);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (!isMobile || !enableSwipe) return;
    
    if (direction === 'left' && currentIndex < orderedItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (direction === 'right' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleDragEnd = (event: any, info: PanInfo, itemId: string) => {
    if (!enableSwipe || !isMobile) return;
    
    const threshold = 100;
    if (info.offset.x > threshold) {
      handleSwipe('right');
    } else if (info.offset.x < -threshold) {
      handleSwipe('left');
    }
  };

  const handleReorderDragEnd = (event: any, info: PanInfo, itemId: string) => {
    if (!enableReorder) return;
    
    const draggedIndex = orderedItems.findIndex(item => item.id === itemId);
    const containerRect = containerRef.current?.getBoundingClientRect();
    
    if (!containerRect) return;
    
    // Calculate drop position based on mouse position
    const dropY = event.clientY - containerRect.top;
    const itemHeight = containerRect.height / orderedItems.length;
    const dropIndex = Math.floor(dropY / itemHeight);
    
    if (dropIndex !== draggedIndex && dropIndex >= 0 && dropIndex < orderedItems.length) {
      const newItems = [...orderedItems];
      const [draggedItem] = newItems.splice(draggedIndex, 1);
      newItems.splice(dropIndex, 0, draggedItem);
      
      setOrderedItems(newItems);
      if (onReorder) {
        onReorder(newItems);
      }
    }
    
    setDraggedItem(null);
  };

  const getGridClasses = () => {
    if (isMobile && enableSwipe) {
      return 'flex overflow-hidden';
    }
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
  };

  const getItemClasses = (item: GridItem) => {
    if (isMobile && enableSwipe) {
      return 'flex-shrink-0 w-full px-2';
    }
    
    const { span = {} } = item;
    const mobileSpan = span.mobile || 1;
    const tabletSpan = span.tablet || 1;
    const desktopSpan = span.desktop || 1;
    
    return `col-span-${mobileSpan} md:col-span-${tabletSpan} lg:col-span-${desktopSpan}`;
  };

  // Sort items by priority for mobile
  const sortedItems = isMobile 
    ? [...orderedItems].sort((a, b) => (b.priority || 0) - (a.priority || 0))
    : orderedItems;

  return (
    <div className={`relative ${className}`}>
      {/* Mobile swipe navigation */}
      {isMobile && enableSwipe && sortedItems.length > 1 && (
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSwipe('right')}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex space-x-2">
            {sortedItems.map((_, index) => (
              <button
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSwipe('left')}
            disabled={currentIndex === sortedItems.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Grid container */}
      <div 
        ref={containerRef}
        className={getGridClasses()}
        style={isMobile && enableSwipe ? {
          transform: `translateX(-${currentIndex * 100}%)`,
          transition: 'transform 0.3s ease-in-out'
        } : {}}
      >
        <AnimatePresence mode="wait">
          {sortedItems.map((item, index) => (
            <motion.div
              key={item.id}
              className={getItemClasses(item)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: draggedItem === item.id ? 1.05 : 1,
                zIndex: draggedItem === item.id ? 10 : 1
              }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.3, 
                delay: isMobile ? 0 : index * 0.1 
              }}
              drag={enableReorder && !isMobile ? 'y' : enableSwipe && isMobile ? 'x' : false}
              dragConstraints={enableReorder ? containerRef : { left: 0, right: 0 }}
              dragElastic={0.1}
              onDragStart={() => {
                if (enableReorder) {
                  setDraggedItem(item.id);
                }
              }}
              onDragEnd={(event, info) => {
                if (enableReorder && !isMobile) {
                  handleReorderDragEnd(event, info, item.id);
                } else if (enableSwipe && isMobile) {
                  handleDragEnd(event, info, item.id);
                }
              }}
              whileHover={enableReorder ? { scale: 1.02 } : {}}
              whileTap={enableSwipe ? { scale: 0.98 } : {}}
            >
              <div className="relative h-full">
                {enableReorder && !isMobile && (
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Grip className="h-4 w-4 text-gray-400 cursor-grab" />
                  </div>
                )}
                
                <div className="h-full group">
                  {item.component}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Mobile swipe hint */}
      {isMobile && enableSwipe && sortedItems.length > 1 && currentIndex === 0 && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-1/2 right-4 transform -translate-y-1/2 pointer-events-none"
        >
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-lg flex items-center space-x-1">
            <span>Swipe</span>
            <ChevronLeft className="h-3 w-3" />
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Hook for managing grid state
export function useGridState(initialItems: GridItem[]) {
  const [items, setItems] = useState(initialItems);
  const [isReordering, setIsReordering] = useState(false);

  const updateItem = (id: string, updates: Partial<GridItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const addItem = (item: GridItem, position?: number) => {
    setItems(prev => {
      if (position !== undefined) {
        const newItems = [...prev];
        newItems.splice(position, 0, item);
        return newItems;
      }
      return [...prev, item];
    });
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const reorderItems = (newItems: GridItem[]) => {
    setItems(newItems);
  };

  const toggleReordering = () => {
    setIsReordering(!isReordering);
  };

  return {
    items,
    isReordering,
    updateItem,
    addItem,
    removeItem,
    reorderItems,
    toggleReordering
  };
}

// Responsive breakpoint hook
export function useResponsiveBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}
