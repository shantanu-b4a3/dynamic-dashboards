import React, { useRef, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import SavedDashboardsList from './components/SavedDashboardsList';
import DashboardCanvas from './components/DashboardCanvas';
import QueryPanel from './components/QueryPanel';
// import { Dashboard } from './types';

const DashboardApp: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isQueryPanelCollapsed, setIsQueryPanelCollapsed] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  const toggleQueryPanel = () => setIsQueryPanelCollapsed(prev => !prev);

  const sidebarWidthClass = isSidebarCollapsed ? 'w-14' : 'w-80';
  const queryPanelWidthClass = isQueryPanelCollapsed ? 'w-14' : 'w-96';

  const canvasRef = useRef<HTMLDivElement>(null);

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
        <div className={`${sidebarWidthClass} flex-shrink-0 transition-all duration-300`}>
          <SavedDashboardsList
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebar} 
            canvasRef={canvasRef}
          />
        </div>

        <div className="flex-1 min-w-0">
          <DashboardCanvas canvasRef={canvasRef} />
        </div>

        <div className={`${queryPanelWidthClass} flex-shrink-0 transition-all duration-300`}>
          <QueryPanel 
            isCollapsed={isQueryPanelCollapsed} 
            onToggleCollapse={toggleQueryPanel}
          />
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