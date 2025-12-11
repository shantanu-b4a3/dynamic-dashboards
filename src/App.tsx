import React, { useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import SavedDashboardsList from './components/SavedDashboardsList';
import DashboardCanvas from './components/DashboardCanvas';
import QueryPanel from './components/QueryPanel';
import { Dashboard } from './types';

const DashboardApp: React.FC = () => {
  const { state, dispatch } = useDashboard();

  useEffect(() => {
    if (state.dashboards.length === 0) {
      const demoDashboard: Dashboard = {
        id: 'demo-dashboard',
        name: 'Demo Dashboard',
        description: 'Sample dashboard with interactive widgets',
        widgets: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_DASHBOARD', payload: demoDashboard });
    }
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 overflow-hidden">
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8" />
            Dover Natural Language Dashboard Generator
          </h1>
          <p className="text-sm text-blue-100 mt-1">
            Transform natural language into dynamic, interactive dashboards
          </p>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 flex-shrink-0">
          <SavedDashboardsList />
        </div>

        <div className="flex-1 min-w-0">
          <DashboardCanvas />
        </div>

        <div className="w-96 flex-shrink-0">
          <QueryPanel />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <DashboardProvider>
      <DashboardApp />
    </DashboardProvider>
  );
};

export default App;