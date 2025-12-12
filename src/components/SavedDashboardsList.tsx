import React, { useMemo, useState } from 'react';
import { Menu, ArrowRightToLine, Search, Trash2, Download, Settings, MoreVertical, ChevronDown, ChevronRight, Eye, EyeOff, Share2 } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { Dashboard, ShareConfig } from '../types';
import { ShareDashboardModal } from './ModalComponents';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface SavedDashboardsListProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  canvasRef: React.RefObject<HTMLDivElement>;
}

// 🆕 NEW: Download dashboard as JSON (all widget data)
const downloadDashboardJSON = (dashboard: Dashboard) => {
    const dataToExport = {
      name: dashboard.name,
      description: dashboard.description,
      createdAt: dashboard.createdAt,
      updatedAt: dashboard.updatedAt,
      widgets: dashboard.widgets.map(widget => ({
        title: widget.title,
        query: widget.query,
        chartType: widget.llmResponse.chartType,
        metric: widget.llmResponse.metric,
        dimension: widget.llmResponse.dimension,
        data: widget.chartData.data,
        metadata: widget.chartData.metadata,
        validationState: widget.validationState,
        createdAt: widget.createdAt,
      }))
    };

    const filename = `${dashboard.name.replace(/\s+/g, '_')}_data.json`;
    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// 🆕 NEW: Download dashboard as SVG
const downloadDashboardSVG = async (dashboard: Dashboard, canvasRef: React.RefObject<HTMLDivElement>) => {
    if (!canvasRef.current) {
      alert('Canvas not found. Please make sure the dashboard is visible.');
      return;
    }

    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: '#f9fafb',
        scale: 2,
      });

      // Convert canvas to SVG
      const imgData = canvas.toDataURL('image/png');
      
      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
          <image href="${imgData}" width="${canvas.width}" height="${canvas.height}" />
        </svg>
      `;

      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dashboard.name.replace(/\s+/g, '_')}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading SVG:', error);
      alert('Failed to download dashboard as SVG');
    }
};

// 🆕 NEW: Download dashboard as PDF
const downloadDashboardPDF = async (dashboard: Dashboard, canvasRef: React.RefObject<HTMLDivElement>) => {
    if (!canvasRef.current) {
      alert('Canvas not found. Please make sure the dashboard is visible.');
      return;
    }

    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: '#f9fafb',
        scale: 2,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${dashboard.name.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download dashboard as PDF');
    }
};

// 🆕 NEW: Download dashboard as CSV
const downloadDashboardCSV = (dashboard: Dashboard) => {
  // 1. Start with Dashboard Metadata
  let csvContent = `Dashboard Name,${escapeCSV(dashboard.name)}\n`;
  csvContent += `Description,${escapeCSV(dashboard.description)}\n`;
  csvContent += `Created At,${dashboard.createdAt}\n\n`;

  // 2. Iterate through each widget
  dashboard.widgets.forEach((widget) => {
    // Add a section header for the widget
    csvContent += `WIDGET: ${escapeCSV(widget.title)}\n`;
    csvContent += `Type,${widget.llmResponse.chartType}\n`;

    const data = widget.chartData.data;

    // Check if data exists
    if (!data || data.length === 0) {
      csvContent += "No data available for this widget\n\n";
      return;
    }

    // Get Headers dynamically from the first data object
    const headers = Object.keys(data[0]);
    csvContent += headers.map(escapeCSV).join(",") + "\n";

    // Map rows
    data.forEach((row: any) => {
      const rowLine = headers.map((header) => {
        const cellValue = row[header];
        return escapeCSV(cellValue);
      }).join(",");
      csvContent += rowLine + "\n";
    });

    // Add spacing between widgets
    csvContent += "\n\n";
  });

  // 3. Create and download the file
  const filename = `${dashboard.name.replace(/\s+/g, '_')}_data.csv`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const escapeCSV = (value: any) => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
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
            <div className="bg-white rounded-xl shadow-2xl w-96 p-6">
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

// 🆕 NEW: Download menu component
interface DownloadMenuProps {
  dashboard: Dashboard;
  canvasRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
}

const DownloadMenu: React.FC<DownloadMenuProps> = ({ dashboard, canvasRef, onClose }) => {
  return (
    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-30">
      <button 
        onClick={() => { downloadDashboardJSON(dashboard); onClose(); }}
        className="w-full text-left flex items-center p-3 text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg"
      >
        <Download className="w-4 h-4 mr-2" /> 
        Download as JSON
      </button>
      <button
        onClick = {() => { downloadDashboardCSV(dashboard); onClose(); }}
        className="w-full text-left flex items-center p-3 text-sm text-gray-700 hover:bg-gray-100"
      >
        <Download className="w-4 h-4 mr-2" />
        Download as CSV
      </button>
      <button 
        onClick={() => { downloadDashboardSVG(dashboard, canvasRef); onClose(); }}
        className="w-full text-left flex items-center p-3 text-sm text-gray-700 hover:bg-gray-100"
      >
        <Download className="w-4 h-4 mr-2" /> 
        Download as SVG
      </button>
      <button 
        onClick={() => { downloadDashboardPDF(dashboard, canvasRef); onClose(); }}
        className="w-full text-left flex items-center p-3 text-sm text-gray-700 hover:bg-gray-100 rounded-b-lg"
      >
        <Download className="w-4 h-4 mr-2" /> 
        Download as PDF
      </button>
    </div>
  );
};

const SavedDashboardsList: React.FC<SavedDashboardsListProps> = ({ isCollapsed, onToggleCollapse, canvasRef }) => {
    const { state, dispatch } = useDashboard();
    const { dashboards, activeDashboard } = state;
    const ToggleIcon = isCollapsed ? ArrowRightToLine : Menu;

    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState<'date-desc' | 'name-asc'>('date-desc');
    const [selectedDashboards, setSelectedDashboards] = useState<string[]>([]);
    const [editingDashboardId, setEditingDashboardId] = useState<string | null>(null);
    const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);
    const [expandedDashboards, setExpandedDashboards] = useState<string[]>([]);
    // 🆕 NEW: Download menu state
    const [downloadMenuOpenId, setDownloadMenuOpenId] = useState<string | null>(null);
    // 🆕 NEW: Share modal state
    const [sharingDashboardId, setSharingDashboardId] = useState<string | null>(null);

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

    // 🔄 UPDATED: Batch download now shows menu
    // const handleBatchDownload = () => {
    //     if (selectedDashboards.length === 0) return;
        
    //     const dashboardsToDownload = dashboards.filter(d => selectedDashboards.includes(d.id));
    //     dashboardsToDownload.forEach(dashboard => downloadDashboardJSON(dashboard));
    // };

    const handleUpdateDashboard = (id: string, name: string, description: string) => {
        dispatch({
            type: 'UPDATE_DASHBOARD',
            payload: {
                id,
                updates: { name, description }
            }
        });
    };

    const toggleDashboardExpansion = (dashboardId: string) => {
        setExpandedDashboards(prev => 
            prev.includes(dashboardId) 
                ? prev.filter(id => id !== dashboardId)
                : [...prev, dashboardId]
        );
    };

    const handleToggleWidgetVisibility = (widgetId: string, dashboardId: string) => {
        const dashboard = dashboards.find(d => d.id === dashboardId);
        if (activeDashboard?.id !== dashboardId && dashboard) {
            dispatch({ type: 'SET_ACTIVE_DASHBOARD', payload: dashboard });
        }
        dispatch({ type: 'TOGGLE_WIDGET_VISIBILITY', payload: widgetId });
    };

    // 🆕 NEW: Delete individual widget
    const handleDeleteWidget = (widgetId: string) => {
        if (confirm('Are you sure you want to delete this widget? This action cannot be undone.')) {
            dispatch({ type: 'REMOVE_WIDGET', payload: widgetId });
        }
    };

    // 🆕 NEW: Share handler
    const handleShare = (config: ShareConfig) => {
        const dashboard = dashboards.find(d => d.id === sharingDashboardId);
        if (!dashboard) return;

        const updatedSharedWith = [...(dashboard.sharedWith || []), config];
        dispatch({
            type: 'UPDATE_DASHBOARD',
            payload: {
                id: dashboard.id,
                updates: { sharedWith: updatedSharedWith }
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
        {editingDashboardId && (
            <EditDashboardModal
                dashboard={dashboards.find(d => d.id === editingDashboardId)!}
                onClose={() => setEditingDashboardId(null)}
                onSave={handleUpdateDashboard}
            />
        )}

        {/* 🆕 NEW: Share Modal */}
        {sharingDashboardId && (
            <ShareDashboardModal
                dashboard={dashboards.find(d => d.id === sharingDashboardId)!}
                onClose={() => setSharingDashboardId(null)}
                onShare={handleShare}
            />
        )}

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

        <div className="p-4 border-b border-gray-200 space-y-3">
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

            <div className="flex justify-between items-center text-sm">
                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'date-desc' | 'name-asc')}
                    className="p-2 border border-gray-300 rounded-lg text-gray-700 bg-white"
                >
                    <option value="date-desc">Newest First</option>
                    <option value="name-asc">Name (A-Z)</option>
                </select>

                {/* 🔄 UPDATED: Download button now shows menu */}
                <div className="flex space-x-2 relative">
                    {/* <div className="relative">
                        <button 
                            onClick={() => setDownloadMenuOpenId(downloadMenuOpenId ? null : 'batch')}
                            disabled={selectedDashboards.length === 0}
                            title="Download Selected"
                            className="p-2 text-gray-600 rounded-lg border hover:bg-gray-100 disabled:opacity-50"
                        >
                            <Download className="w-4 h-4" />
                        </button>
                        {downloadMenuOpenId === 'batch' && selectedDashboards.length > 0 && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                                <button 
                                    onClick={() => { handleBatchDownload(); setDownloadMenuOpenId(null); }}
                                    className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                                >
                                    <Download className="w-4 h-4 inline mr-2" /> 
                                    Download JSON (All)
                                </button>
                            </div>
                        )}
                    </div> */}
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

        <div className="flex-1 overflow-auto p-4">
          {filteredAndSortedDashboards.length === 0 ? (
            <div className="text-center text-gray-400 mt-8">
              <p className="text-sm">No dashboards found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAndSortedDashboards.map((dashboard) => {
                const isExpanded = expandedDashboards.includes(dashboard.id);
                
                return (
                  <div
                      key={dashboard.id}
                      className={`relative w-full rounded-lg border transition-all ${
                      activeDashboard?.id === dashboard.id
                        ? 'bg-blue-50 border-blue-500 shadow-md'
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-sm'
                      }`}
                  >
                      <input
                          type="checkbox"
                          checked={selectedDashboards.includes(dashboard.id)}
                          onChange={(e) => handleSelectDashboard(dashboard.id, e.target.checked)}
                          className="absolute top-2 left-2 z-10 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                      />

                      <button
                          onClick={() => dispatch({ type: 'SET_ACTIVE_DASHBOARD', payload: dashboard })}
                          className="w-full text-left p-4 pr-12 pl-8"
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
                      
                      <div className="absolute top-2 right-2 z-20">
                          <button
                              onClick={(e) => { e.stopPropagation(); setDropdownOpenId(dropdownOpenId === dashboard.id ? null : dashboard.id); }}
                              className="p-1 rounded-full text-gray-500 hover:bg-gray-200"
                          >
                              <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {dropdownOpenId === dashboard.id && (
                              <div 
                                  className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-30"
                                  onBlur={() => setDropdownOpenId(null)} 
                                  tabIndex={-1}
                              >
                                  <button 
                                      onClick={() => { setEditingDashboardId(dashboard.id); setDropdownOpenId(null); }}
                                      className="w-full text-left flex items-center p-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                      <Settings className="w-4 h-4 mr-2" /> Edit
                                  </button>
                                  
                                  {/* 🆕 NEW: Share option */}
                                  <button 
                                      onClick={() => { setSharingDashboardId(dashboard.id); setDropdownOpenId(null); }}
                                      className="w-full text-left flex items-center p-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                      <Share2 className="w-4 h-4 mr-2" /> Share
                                  </button>
                                  
                                  {/* 🔄 UPDATED: Download now opens submenu */}
                                  <div className="relative">
                                      <button 
                                          onClick={() => setDownloadMenuOpenId(downloadMenuOpenId === dashboard.id ? null : dashboard.id)}
                                          className="w-full text-left flex items-center p-2 text-sm text-gray-700 hover:bg-gray-100"
                                      >
                                          <Download className="w-4 h-4 mr-2" /> Download
                                      </button>
                                      {downloadMenuOpenId === dashboard.id && (
                                          <DownloadMenu
                                              dashboard={dashboard}
                                              canvasRef={canvasRef}
                                              onClose={() => setDownloadMenuOpenId(null)}
                                          />
                                      )}
                                  </div>
                                  
                                  <button 
                                      onClick={() => handleIndividualDelete(dashboard.id, dashboard.name)}
                                      className="w-full text-left flex items-center p-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                                  </button>
                              </div>
                          )}
                      </div>

                      {dashboard.widgets.length > 0 && (
                        <div className="border-t border-gray-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDashboardExpansion(dashboard.id);
                            }}
                            className="w-full flex items-center justify-between px-4 py-2 text-xs text-gray-600 hover:bg-gray-50"
                          >
                            <span className="font-medium">Widgets ({dashboard.widgets.length})</span>
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </button>
                          
                          {isExpanded && (
                            <div className="px-4 pb-2 space-y-1">
                              {dashboard.widgets.map(widget => (
                                <div
                                  key={widget.id}
                                  className={`flex items-center justify-between p-2 rounded text-xs transition-colors ${
                                    widget.visible 
                                      ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleWidgetVisibility(widget.id, dashboard.id);
                                    }}
                                    className="flex items-center gap-2 flex-1 text-left"
                                    title={widget.visible ? 'Click to hide' : 'Click to show'}
                                  >
                                    <span className="truncate flex-1">{widget.title.length > 30 ? widget.title.slice(0, 30) + '...' : widget.title}</span>
                                    {widget.visible ? (
                                      <Eye className="w-3 h-3 flex-shrink-0" />
                                    ) : (
                                      <EyeOff className="w-3 h-3 flex-shrink-0" />
                                    )}
                                  </button>
                                  {/* 🆕 NEW: Delete widget button */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteWidget(widget.id);
                                    }}
                                    className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                                    title="Delete widget permanently"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
};

export default SavedDashboardsList;