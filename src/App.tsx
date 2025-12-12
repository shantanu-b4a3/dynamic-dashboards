import React, { useRef, useState } from 'react';
import { User, Settings, HelpCircle, LogOut, ChevronDown } from 'lucide-react';
import { DashboardProvider } from './context/DashboardContext';
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
      <header className="bg-slate-900 text-white shadow-md z-30 relative shrink-0">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <img 
              src='https://www.dovercorporation.com/images/default-source/template-graphics/logo-dover_main.png?sfvrsn=9c8c1ac8_2' 
              alt="Dover Logo" 
              className="h-10 w-auto" 
            />

            <div className="hidden md:block">
              <h1 className="text-xl font-bold leading-tight tracking-tight text-white">
                Dover Natural Language Dashboard Generator
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Transform natural language into dynamic, interactive analytics
              </p>
            </div>
          </div>

          {/* ✨ NEW: User Profile Section */}
          <div className="relative ml-6">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 outline-none group ${
                showUserMenu ? 'bg-slate-800' : 'hover:bg-slate-800'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-sm ring-2 ring-slate-900 group-hover:ring-slate-700 transition-all">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-slate-100 leading-none">Dover Opco User</p>
                <p className="text-xs text-slate-400 mt-1">Dashboard Admin</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* ✨ NEW: User dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                  <p className="text-sm font-bold text-gray-900">Dover Opco User</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">admindasuser@dovercorp.com</p>
                </div>
                
                <div className="py-2">
                  <button onClick={handleSettings} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-3 transition-colors">
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <button onClick={handleHelp} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 flex items-center gap-3 transition-colors">
                    <HelpCircle className="w-4 h-4" /> Help & Support
                  </button>
                </div>

                <div className="border-t border-gray-100 py-2">
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors">
                    <LogOut className="w-4 h-4" /> Logout
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