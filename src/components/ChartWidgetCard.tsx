import React, { useState, useEffect, useRef } from 'react';
import { X, GripVertical, Maximize2, BarChart3 } from 'lucide-react';
import ChartRenderer from './ChartRenderer';
import { ChartWidget } from '../types';

interface ChartWidgetCardProps {
  widget: ChartWidget;
  onRemove: () => void;
  onUpdate: (updates: Partial<ChartWidget>) => void;
}

const ChartWidgetCard: React.FC<ChartWidgetCardProps> = ({ widget, onRemove, onUpdate }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      e.preventDefault();
      setIsDragging(true);
      const rect = widgetRef.current!.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && widgetRef.current) {
        const parent = widgetRef.current.parentElement!;
        const parentRect = parent.getBoundingClientRect();
        
        let newX = e.clientX - parentRect.left - dragOffset.x;
        let newY = e.clientY - parentRect.top - dragOffset.y;

        newX = Math.max(0, Math.min(newX, parentRect.width - widget.size.width));
        newY = Math.max(0, Math.min(newY, parentRect.height - widget.size.height));

        onUpdate({ position: { x: newX, y: newY } });
      } else if (isResizing && widgetRef.current) {
        const rect = widgetRef.current.getBoundingClientRect();
        const newWidth = Math.max(250, e.clientX - rect.left);
        const newHeight = Math.max(200, e.clientY - rect.top);
        onUpdate({ size: { width: newWidth, height: newHeight } });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, widget.size, onUpdate]);

  return (
    <div
      ref={widgetRef}
      className="absolute bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
      style={{
        left: widget.position.x,
        top: widget.position.y,
        width: widget.size.width,
        height: widget.size.height,
        cursor: isDragging ? 'grabbing' : 'default',
        zIndex: isDragging || isResizing ? 1000 : 1,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex items-center justify-between drag-handle cursor-move">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-gray-800 text-sm truncate">{widget.title}</h3>
        </div>
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
          title="Remove widget"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4" style={{ height: 'calc(100% - 100px)' }}>
        <ChartRenderer llmResponse={widget.llmResponse} cubeData={widget.chartData} />
      </div>

      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 truncate">
        {widget.query}
      </div>

      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize group"
        onMouseDown={handleResizeMouseDown}
      >
        <Maximize2 className="w-4 h-4 text-gray-400 group-hover:text-blue-600 absolute bottom-1 right-1" />
      </div>
    </div>
  );
};

export default ChartWidgetCard;