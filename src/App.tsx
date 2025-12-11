import React, { useRef, useState } from 'react';
import { BarChart3, User, Settings, HelpCircle, LogOut, ChevronDown } from 'lucide-react';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import SavedDashboardsList from './components/SavedDashboardsList';
import DashboardCanvas from './components/DashboardCanvas';
import QueryPanel from './components/QueryPanel';
// import DoverLogo from './assets/dover-logo-png-transparent.png'

const DashboardApp: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isQueryPanelCollapsed, setIsQueryPanelCollapsed] = useState(false);
  // ✨ NEW: State for user menu dropdown
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);
  const toggleQueryPanel = () => setIsQueryPanelCollapsed(prev => !prev);

  const sidebarWidthClass = isSidebarCollapsed ? 'w-14' : 'w-80';
  const queryPanelWidthClass = isQueryPanelCollapsed ? 'w-14' : 'w-96';

  const canvasRef = useRef<HTMLDivElement>(null);

  // ✨ NEW: User menu handlers
  const handleSettings = () => {
    alert('Settings panel coming soon!');
    setShowUserMenu(false);
  };

  const handleHelp = () => {
    alert('Help & Documentation coming soon!');
    setShowUserMenu(false);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      alert('Logout functionality coming soon!');
      setShowUserMenu(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* ✨ UPDATED: Header with user profile section */}
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              {/* <BarChart3 className="w-8 h-8" /> */}
              <img src='https://cdn.freebiesupply.com/logos/large/2x/dover-logo-png-transparent.png' alt="demo" className="w-16 h-16" />
              Dover Natural Language Dashboard Generator
            </h1>
            <p className="text-sm text-blue-100 mt-1">
              Transform natural language into dynamic, interactive dashboards
            </p>
          </div>

          {/* ✨ NEW: User Profile Section */}
          <div className="relative ml-6">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold">John Doe</p>
                <p className="text-xs text-blue-100">Admin</p>
              </div>
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* ✨ NEW: User dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-800">John Doe</p>
                  <p className="text-xs text-gray-500">john.doe@example.com</p>
                </div>
                
                <div className="py-2">
                  <button
                    onClick={handleSettings}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  
                  <button
                    onClick={handleHelp}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Help & Support
                  </button>
                </div>

                <div className="border-t border-gray-200 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
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