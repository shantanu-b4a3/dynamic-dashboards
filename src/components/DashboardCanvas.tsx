import React from 'react';
import { BarChart3, Plus } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import ChartWidgetCard from './ChartWidgetCard';

const DashboardCanvas: React.FC = () => {
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

  if (activeDashboard.widgets.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <Plus className="w-16 h-16 text-blue-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Add Your First Widget</h2>
          <p className="text-gray-500">Use the query panel to generate charts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {activeDashboard.widgets.map((widget) => (
        <ChartWidgetCard
          key={widget.id}
          widget={widget}
          onRemove={() => dispatch({ type: 'REMOVE_WIDGET', payload: widget.id })}
          onUpdate={(updates) => dispatch({ type: 'UPDATE_WIDGET', payload: { id: widget.id, updates } })}
        />
      ))}
    </div>
  );
};

export default DashboardCanvas;