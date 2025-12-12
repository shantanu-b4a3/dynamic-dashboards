import React from 'react';
import { BarChart3, LineChart, PieChart, Plus, Table } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import ChartWidgetCard from './ChartWidgetCard';

// Added canvasRef prop to support reference from parent
interface DashboardCanvasProps {
  canvasRef: React.RefObject<HTMLDivElement>;
}

const DashboardCanvas: React.FC<DashboardCanvasProps> = ({ canvasRef }) => {
  const { state, dispatch } = useDashboard();
  const { activeDashboard } = state;

  if (!activeDashboard) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-400 mb-2">No Active Dashboard</h2>
          <p className="text-gray-500">Create a new dashboard or select an existing one</p>
        </div>
      </div>
    );
  }

  // Filter to only show visible widgets
  const visibleWidgets = activeDashboard.widgets.filter(widget => widget.visible);

  if (visibleWidgets.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <BarChart3 className="w-8 h-8 text-blue-400 opacity-90" />
            <PieChart className="w-10 h-10 text-blue-500 shadow-lg p-1 rounded-full bg-blue-50/50" />
            <LineChart className="w-8 h-8 text-blue-400 opacity-90" />
            <Table className="w-7 h-7 text-blue-400 opacity-80 mt-2" />
        </div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Add Your First Widget</h2>
          <p className="text-gray-500">Use the query panel to generate charts or click on saved widgets</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={canvasRef} className="h-full relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* UPDATED: Only render visible widgets */}
      {visibleWidgets.map((widget) => (
        <ChartWidgetCard
          key={widget.id}
          widget={widget}
          onRemove={() => dispatch({ type: 'TOGGLE_WIDGET_VISIBILITY', payload: widget.id })}
          onUpdate={(updates) => dispatch({ type: 'UPDATE_WIDGET', payload: { id: widget.id, updates } })}
        />
      ))}
    </div>
  );
};

export default DashboardCanvas;