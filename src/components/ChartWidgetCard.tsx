import React, { useState, useEffect, useRef } from 'react';
import { X, GripVertical, Maximize2, BarChart3, Download } from 'lucide-react';
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
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const downloadBtnRef = useRef<HTMLButtonElement>(null);

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

  const downloadAsSVG = async () => {
    if (!chartRef.current) return;

    try {
      const svgElements = chartRef.current.querySelectorAll('svg');
      if (svgElements.length === 0) return;

      const svg = svgElements[0].cloneNode(true) as SVGElement;
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${widget.title.replace(/\s+/g, '_')}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setShowDownloadMenu(false);
    } catch (error) {
      console.error('Error downloading SVG:', error);
      alert('Failed to download chart as SVG');
    }
  };

  const downloadAsJSON = () => {
    try {
      const dataToExport = {
        title: widget.title,
        query: widget.query,
        chartType: widget.llmResponse.chartType,
        metric: widget.llmResponse.metric,
        dimension: widget.llmResponse.dimension,
        data: widget.chartData.data,
        metadata: widget.chartData.metadata,
        createdAt: widget.createdAt
      };

      const json = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${widget.title.replace(/\s+/g, '_')}_data.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setShowDownloadMenu(false);
    } catch (error) {
      console.error('Error downloading JSON:', error);
      alert('Failed to download data as JSON');
    }
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

  useEffect(() => {
    if (!showDownloadMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (downloadBtnRef.current && !downloadBtnRef.current.contains(e.target as Node)) {
        const downloadMenu = document.getElementById(`download-menu-${widget.id}`);
        if (downloadMenu && !downloadMenu.contains(e.target as Node)) {
          setShowDownloadMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDownloadMenu, widget.id]);

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
        {/* Added download button with dropdown menu */}
        <div className="flex items-center gap-1">
          <div className="relative">
            <button
              ref={downloadBtnRef}
              onClick={(e) => {
                e.stopPropagation();
                setShowDownloadMenu(!showDownloadMenu);
              }}
              className="text-gray-400 hover:text-blue-600 transition-colors p-1 cursor-pointer"
              title="Download chart"
            >
              <Download className="w-4 h-4" />
            </button>
            
            {showDownloadMenu && (
              <div 
                id={`download-menu-${widget.id}`}
                className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-xl z-50"
              >
                <button
                  onClick={downloadAsSVG}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 rounded-t-lg"
                >
                  <Download className="w-3 h-3" />
                  Download as SVG
                </button>
                <button
                  onClick={downloadAsJSON}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 rounded-b-lg"
                >
                  <Download className="w-3 h-3" />
                  Download as JSON
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={onRemove}
            className="text-gray-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
            title="Hide widget"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/*Added ref to chart container for SVG export */}
      <div ref={chartRef} className="p-4" style={{ height: 'calc(100% - 100px)' }}>
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