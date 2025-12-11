import React, { useMemo, useState } from 'react';
import { Menu, ArrowRightToLine, Search, Trash2, Download, Settings, MoreVertical, X } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { Dashboard } from '../types';

interface SavedDashboardsListProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const downloadDashboard = (dashboard: Dashboard) => {
    const filename = `${dashboard.name.replace(/\s/g, '_')}.json`;
    const data = JSON.stringify(dashboard, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert(`Dashboard "${dashboard.name}" downloaded.`);
};

interface EditModalProps {
    dashboard: Dashboard;
    onClose: () => void;
    onSave: (id: string, name: string, description: string) => void;
}

const EditDashboardModal: React.FC<EditModalProps> = ({ dashboard, onClose, onSave }) => {
    const [name, setName] = useState(dashboard.name);
    const [description, setDescription] = useState(dashboard.description || '');

    const handleSave = () => {
        onSave(dashboard.id, name, description);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                <h3 className="text-xl font-bold mb-4">Edit Dashboard</h3>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                />
                <label className="block text-sm font-medium text-gray-700 mt-3">Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 resize-none"
                    rows={3}
                />
                <div className="flex justify-end space-x-3 mt-5">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-100">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
                </div>
             </div>
        </div>
    );
};

  const SavedDashboardsList: React.FC<SavedDashboardsListProps> = ({ isCollapsed, onToggleCollapse }) => {
    const { state, dispatch } = useDashboard();
    const { dashboards, activeDashboard } = state;
    const ToggleIcon = isCollapsed ? ArrowRightToLine : Menu;

    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'date-desc' | 'name-asc'>('date-desc');
    const [selectedDashboards, setSelectedDashboards] = useState<string[]>([]);
    const [editingDashboardId, setEditingDashboardId] = useState<string | null>(null);
    const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);

    const filteredAndSortedDashboards = useMemo(() => {
        let list = [...dashboards];
        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            list = list.filter(d => 
                d.name.toLowerCase().includes(lowerCaseSearch) ||
                (d.description && d.description.toLowerCase().includes(lowerCaseSearch))
            );
        }
        list.sort((a, b) => {
            if (sortOrder === 'name-asc') {
                return a.name.localeCompare(b.name);
            }
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        return list;
    }, [dashboards, searchTerm, sortOrder]);

    const handleSelectDashboard = (id: string, isChecked: boolean) => {
        setSelectedDashboards(prev => 
            isChecked ? [...prev, id] : prev.filter(selectedId => selectedId !== id)
        );
    };
    
    const handleIndividualDelete = (id: string, name: string) => {
        if (confirm(`Are you sure you want to delete the dashboard "${name}"?`)) {
            dispatch({ type: 'DELETE_DASHBOARD', payload: id });
        }
        setDropdownOpenId(null);
    };

    const handleBatchDelete = () => {
        if (selectedDashboards.length === 0) return;
        if (confirm(`Are you sure you want to delete ${selectedDashboards.length} selected dashboard(s)?`)) {
            selectedDashboards.forEach(id => {
                dispatch({ type: 'DELETE_DASHBOARD', payload: id });
            });
            setSelectedDashboards([]);
        }
    };

    const handleBatchDownload = () => {
        if (selectedDashboards.length === 0) return;
        
        // Find the full dashboard objects for download
        const dashboardsToDownload = dashboards.filter(d => selectedDashboards.includes(d.id));
        
        // This is a simplified batch download (e.g., zip or multiple files). 
        // For simplicity, we'll just download them one by one here.
        dashboardsToDownload.forEach(downloadDashboard);
    };

    const handleUpdateDashboard = (id: string, name: string, description: string) => {
        dispatch({
            type: 'UPDATE_DASHBOARD',
            payload: {
                id,
                updates: { name, description }
            }
        });
    };

    if (isCollapsed) {
        return (
            <div className="h-full flex flex-col bg-white border-r border-gray-200">
                <div className="px-3 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center">
                    <button 
                        onClick={onToggleCollapse} 
                        className="p-1 rounded hover:bg-white/20 transition-colors"
                        title="Expand Dashboards"
                    >
                        <ToggleIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 flex items-center justify-center">
                    <span className="text-gray-400 text-xs [writing-mode:vertical-rl] transform rotate-180 opacity-70">
                        Dashboards
                    </span>
                </div>
            </div>
        );
    }
  
  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
        {/* EDIT MODAL */}
        {editingDashboardId && (
            <EditDashboardModal
                dashboard={dashboards.find(d => d.id === editingDashboardId)!}
                onClose={() => setEditingDashboardId(null)}
                onSave={handleUpdateDashboard}
            />
        )}

        {/* HEADER & TOGGLE BUTTON */}
        <div className="flex px-3 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white items-center">
            <button 
                onClick={onToggleCollapse} 
                className="p-1 rounded hover:bg-white/20 transition-colors"
                title="Collapse Dashboards"
            >
                <ToggleIcon className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold flex-1 ml-3 truncate">
                Saved Dashboards
            </h2>
        </div>

        {/* FILTER/SEARCH SUB-PANEL */}
        <div className="p-4 border-b border-gray-200 space-y-3">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search dashboards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* Filter/Batch Actions Row */}
            <div className="flex justify-between items-center text-sm">
                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'date-desc' | 'name-asc')}
                    className="p-2 border border-gray-300 rounded-lg text-gray-700 bg-white"
                >
                    <option value="date-desc">Newest First</option>
                    <option value="name-asc">Name (A-Z)</option>
                </select>

                <div className="flex space-x-2">
                    <button 
                        onClick={handleBatchDownload}
                        disabled={selectedDashboards.length === 0}
                        title="Download Selected"
                        className="p-2 text-gray-600 rounded-lg border hover:bg-gray-100 disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={handleBatchDelete}
                        disabled={selectedDashboards.length === 0}
                        title="Delete Selected"
                        className="p-2 text-red-600 rounded-lg border hover:bg-red-50 disabled:opacity-50"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>

        {/* DASHBOARD LIST */}
        <div className="flex-1 overflow-auto p-4">
          {filteredAndSortedDashboards.length === 0 ? (
            <div className="text-center text-gray-400 mt-8">
              <p className="text-sm">No dashboards found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSortedDashboards.map((dashboard) => (
                <div
                    key={dashboard.id}
                    className={`relative w-full rounded-lg border transition-all ${
                    activeDashboard?.id === dashboard.id
                      ? 'bg-blue-50 border-blue-500 shadow-md'
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                >
                    {/* CHECKBOX for Batch Selection */}
                    <input
                        type="checkbox"
                        checked={selectedDashboards.includes(dashboard.id)}
                        onChange={(e) => handleSelectDashboard(dashboard.id, e.target.checked)}
                        className="absolute top-2 left-2 z-10 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()} // Prevent card click when checkbox is clicked
                    />

                    {/* MAIN CARD CONTENT (Clickable to set active dashboard) */}
                    <button
                        onClick={() => dispatch({ type: 'SET_ACTIVE_DASHBOARD', payload: dashboard })}
                        className="w-full text-left p-4 pr-12 pl-8" // Adjusted padding for checkbox and dropdown
                    >
                        <h3 className="font-semibold text-gray-800">{dashboard.name}</h3>
                        {dashboard.description && (
                            <p className="text-xs text-gray-500 mt-1 truncate">{dashboard.description}</p>
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
                    
                    {/* OPTIONS DROPDOWN BUTTON */}
                    <div className="absolute top-2 right-2 z-20">
                        <button
                            onClick={(e) => { e.stopPropagation(); setDropdownOpenId(dropdownOpenId === dashboard.id ? null : dashboard.id); }}
                            className="p-1 rounded-full text-gray-500 hover:bg-gray-200"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {/* DROPDOWN MENU */}
                        {dropdownOpenId === dashboard.id && (
                            <div 
                                className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-30"
                                // Allows clicking outside to close
                                onBlur={() => setDropdownOpenId(null)} 
                                tabIndex={-1}
                            >
                                <button 
                                    onClick={() => { setEditingDashboardId(dashboard.id); setDropdownOpenId(null); }}
                                    className="w-full text-left flex items-center p-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <Settings className="w-4 h-4 mr-2" /> Edit
                                </button>
                                <button 
                                    onClick={() => downloadDashboard(dashboard)}
                                    className="w-full text-left flex items-center p-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <Download className="w-4 h-4 mr-2" /> Download
                                </button>
                                <button 
                                    onClick={() => handleIndividualDelete(dashboard.id, dashboard.name)}
                                    className="w-full text-left flex items-center p-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
};

export default SavedDashboardsList;