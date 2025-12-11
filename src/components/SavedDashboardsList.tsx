import React from 'react';
import { Menu } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

const SavedDashboardsList: React.FC = () => {
  const { state, dispatch } = useDashboard();
  const { dashboards, activeDashboard } = state;

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Menu className="w-5 h-5" />
          Saved Dashboards
        </h2>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {dashboards.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <p className="text-sm">No saved dashboards</p>
          </div>
        ) : (
          <div className="space-y-2">
            {dashboards.map((dashboard) => (
              <button
                key={dashboard.id}
                onClick={() => dispatch({ type: 'SET_ACTIVE_DASHBOARD', payload: dashboard })}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  activeDashboard?.id === dashboard.id
                    ? 'bg-blue-50 border-blue-500 shadow-md'
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-sm'
                }`}
              >
                <h3 className="font-semibold text-gray-800">{dashboard.name}</h3>
                {dashboard.description && (
                  <p className="text-xs text-gray-500 mt-1">{dashboard.description}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {dashboard.widgets.length} widgets
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(dashboard.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedDashboardsList;