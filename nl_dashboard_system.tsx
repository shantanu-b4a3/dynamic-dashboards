import React, { useState, useEffect, useRef, createContext, useContext, useReducer } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Loader2, Plus, Trash2, Save, BarChart3, Send, Menu, X, GripVertical, Maximize2 } from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface LLMQueryResponse {
  metric: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  dimension: string;
  sort?: 'asc' | 'desc';
  limit?: number;
  timeframe?: string;
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  filters?: Record<string, any>;
}

interface CubeJsResponse {
  data: Array<Record<string, any>>;
  metadata?: {
    total: number;
    executionTime: number;
  };
}

interface ChartWidget {
  id: string;
  title: string;
  query: string;
  llmResponse: LLMQueryResponse;
  chartData: CubeJsResponse;
  position: { x: number; y: number };
  size: { width: number; height: number };
  createdAt: string;
}

interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: ChartWidget[];
  createdAt: string;
  updatedAt: string;
}

interface DashboardState {
  dashboards: Dashboard[];
  activeDashboard: Dashboard | null;
  isLoading: boolean;
  error: string | null;
}

type DashboardAction =
  | { type: 'SET_ACTIVE_DASHBOARD'; payload: Dashboard | null }
  | { type: 'ADD_DASHBOARD'; payload: Dashboard }
  | { type: 'UPDATE_DASHBOARD'; payload: { id: string; updates: Partial<Dashboard> } }
  | { type: 'DELETE_DASHBOARD'; payload: string }
  | { type: 'ADD_WIDGET'; payload: ChartWidget }
  | { type: 'UPDATE_WIDGET'; payload: { id: string; updates: Partial<ChartWidget> } }
  | { type: 'REMOVE_WIDGET'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// ============================================================================
// CONTEXT & REDUCER
// ============================================================================

const DashboardContext = createContext<{
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
} | null>(null);

const dashboardReducer = (state: DashboardState, action: DashboardAction): DashboardState => {
  switch (action.type) {
    case 'SET_ACTIVE_DASHBOARD':
      return { ...state, activeDashboard: action.payload };

    case 'ADD_DASHBOARD':
      return {
        ...state,
        dashboards: [...state.dashboards, action.payload],
        activeDashboard: action.payload,
      };

    case 'UPDATE_DASHBOARD':
      return {
        ...state,
        dashboards: state.dashboards.map((d) =>
          d.id === action.payload.id
            ? { ...d, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : d
        ),
        activeDashboard:
          state.activeDashboard?.id === action.payload.id
            ? { ...state.activeDashboard, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : state.activeDashboard,
      };

    case 'DELETE_DASHBOARD':
      return {
        ...state,
        dashboards: state.dashboards.filter((d) => d.id !== action.payload),
        activeDashboard: state.activeDashboard?.id === action.payload ? null : state.activeDashboard,
      };

    case 'ADD_WIDGET':
      if (!state.activeDashboard) return state;
      const updatedDashboard = {
        ...state.activeDashboard,
        widgets: [...state.activeDashboard.widgets, action.payload],
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        activeDashboard: updatedDashboard,
        dashboards: state.dashboards.map((d) =>
          d.id === updatedDashboard.id ? updatedDashboard : d
        ),
      };

    case 'UPDATE_WIDGET':
      if (!state.activeDashboard) return state;
      const dashboardWithUpdatedWidget = {
        ...state.activeDashboard,
        widgets: state.activeDashboard.widgets.map((w) =>
          w.id === action.payload.id ? { ...w, ...action.payload.updates } : w
        ),
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        activeDashboard: dashboardWithUpdatedWidget,
        dashboards: state.dashboards.map((d) =>
          d.id === dashboardWithUpdatedWidget.id ? dashboardWithUpdatedWidget : d
        ),
      };

    case 'REMOVE_WIDGET':
      if (!state.activeDashboard) return state;
      const dashboardWithoutWidget = {
        ...state.activeDashboard,
        widgets: state.activeDashboard.widgets.filter((w) => w.id !== action.payload),
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        activeDashboard: dashboardWithoutWidget,
        dashboards: state.dashboards.map((d) =>
          d.id === dashboardWithoutWidget.id ? dashboardWithoutWidget : d
        ),
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    default:
      return state;
  }
};

const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within DashboardProvider');
  return context;
};

// ============================================================================
// API SERVICES
// ============================================================================

const LLMService = {
  /**
   * Interprets natural language query using LLM (LLaMA)
   * Integration point: POST /api/llm/interpret
   */
  async interpretQuery(query: string): Promise<LLMQueryResponse> {
    // TODO: Replace with actual LLM API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('sales') || queryLower.includes('product')) {
      return {
        metric: 'sales',
        aggregation: 'sum',
        dimension: 'product',
        sort: 'desc',
        limit: 10,
        timeframe: 'This Month',
        chartType: 'bar',
      };
    } else if (queryLower.includes('revenue') || queryLower.includes('region')) {
      return {
        metric: 'revenue',
        aggregation: 'sum',
        dimension: 'region',
        chartType: 'pie',
        limit: 6,
      };
    } else if (queryLower.includes('trend') || queryLower.includes('over time')) {
      return {
        metric: 'orders',
        aggregation: 'count',
        dimension: 'date',
        chartType: 'line',
        timeframe: 'Last 30 Days',
        limit: 30,
      };
    } else if (queryLower.includes('area') || queryLower.includes('growth')) {
      return {
        metric: 'revenue',
        aggregation: 'sum',
        dimension: 'month',
        chartType: 'area',
        limit: 12,
      };
    } else {
      return {
        metric: 'orders',
        aggregation: 'count',
        dimension: 'category',
        chartType: 'bar',
        limit: 8,
      };
    }
  },
};

const CubeJsService = {
  /**
   * Executes Cube.js query
   * Integration point: POST /cubejs-api/v1/load
   */
  async executeQuery(llmResponse: LLMQueryResponse): Promise<CubeJsResponse> {
    // TODO: Replace with actual Cube.js API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    const limit = llmResponse.limit || 10;

    if (llmResponse.chartType === 'line') {
      return {
        data: Array.from({ length: Math.min(limit, 30) }, (_, i) => ({
          [llmResponse.dimension]: `Day ${i + 1}`,
          [llmResponse.metric]: Math.floor(Math.random() * 5000) + 2000 + i * 100,
        })),
        metadata: { total: limit, executionTime: 245 },
      };
    } else if (llmResponse.chartType === 'pie') {
      return {
        data: Array.from({ length: Math.min(limit, 6) }, (_, i) => ({
          name: `${llmResponse.dimension} ${String.fromCharCode(65 + i)}`,
          value: Math.floor(Math.random() * 5000) + 500,
        })),
        metadata: { total: Math.min(limit, 6), executionTime: 180 },
      };
    } else if (llmResponse.chartType === 'area') {
      return {
        data: Array.from({ length: Math.min(limit, 12) }, (_, i) => ({
          [llmResponse.dimension]: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
          [llmResponse.metric]: Math.floor(Math.random() * 8000) + 2000 + i * 500,
        })),
        metadata: { total: limit, executionTime: 190 },
      };
    }

    return {
      data: Array.from({ length: limit }, (_, i) => ({
        [llmResponse.dimension]: `${llmResponse.dimension} ${i + 1}`,
        [llmResponse.metric]: Math.floor(Math.random() * 10000) + 1000,
      })),
      metadata: { total: limit, executionTime: 220 },
    };
  },
};

// ============================================================================
// CHART RENDERING COMPONENT
// ============================================================================

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

const ChartRenderer: React.FC<{
  llmResponse: LLMQueryResponse;
  cubeData: CubeJsResponse;
}> = ({ llmResponse, cubeData }) => {
  const { chartType, dimension, metric } = llmResponse;
  const data = cubeData.data;

  switch (chartType) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={dimension} tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
            <Bar dataKey={metric} fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 'line':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={dimension} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
            <Line type="monotone" dataKey={metric} stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      );

    case 'pie':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={(entry) => entry.name}
              labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'area':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={dimension} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
            <Area type="monotone" dataKey={metric} stroke="#3b82f6" fill="#93c5fd" fillOpacity={0.6} />
          </AreaChart>
        </ResponsiveContainer>
      );

    default:
      return <div className="flex items-center justify-center h-full text-gray-400">Unsupported chart type</div>;
  }
};

// ============================================================================
// DRAGGABLE & RESIZABLE WIDGET
// ============================================================================

const ChartWidgetCard: React.FC<{
  widget: ChartWidget;
  onRemove: () => void;
  onUpdate: (updates: Partial<ChartWidget>) => void;
}> = ({ widget, onRemove, onUpdate }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

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
        <button
          onClick={onRemove}
          className="text-gray-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
          title="Remove widget"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4" style={{ height: 'calc(100% - 100px)' }}>
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

// ============================================================================
// DASHBOARD CANVAS
// ============================================================================

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

// ============================================================================
// SAVED DASHBOARDS LIST
// ============================================================================

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

// ============================================================================
// QUERY PANEL
// ============================================================================

const QueryPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [llmResponse, setLlmResponse] = useState<LLMQueryResponse | null>(null);
  const [cubeData, setCubeData] = useState<CubeJsResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { state, dispatch } = useDashboard();
  const { activeDashboard } = state;

  const handleSubmitQuery = async () => {
    if (!query.trim()) return;

    setIsProcessing(true);
    setLlmResponse(null);
    setCubeData(null);

    try {
      const llmResult = await LLMService.interpretQuery(query);
      setLlmResponse(llmResult);

      const cubeResult = await CubeJsService.executeQuery(llmResult);
      setCubeData(cubeResult);
    } catch (error) {
      console.error('Error processing query:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToDashboard = () => {
    if (!llmResponse || !cubeData) return;

    if (!activeDashboard) {
      const newDashboard: Dashboard = {
        id: `dashboard-${Date.now()}`,
        name: 'New Dashboard',
        widgets: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_DASHBOARD', payload: newDashboard });
    }

    const widgetCount = activeDashboard?.widgets.length || 0;
    const newWidget: ChartWidget = {
      id: `widget-${Date.now()}`,
      title: `${llmResponse.metric} by ${llmResponse.dimension}`,
      query,
      llmResponse,
      chartData: cubeData,
      position: { x: 20 + (widgetCount % 3) * 420, y: 20 + Math.floor(widgetCount / 3) * 320 },
      size: { width: 400, height: 300 },
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_WIDGET', payload: newWidget });
    setQuery('');
    setLlmResponse(null);
    setCubeData(null);
  };

  const handleCreateNewDashboard = () => {
    const name = prompt('Enter dashboard name:');
    if (!name) return;

    const newDashboard: Dashboard = {
      id: `dashboard-${Date.now()}`,
      name,
      widgets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_DASHBOARD', payload: newDashboard });
  };

  const handleDeleteDashboard = () => {
    if (activeDashboard && confirm(`Delete dashboard "${activeDashboard.name}"?`)) {
      dispatch({ type: 'DELETE_DASHBOARD', payload: activeDashboard.id });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <h2 className="text-lg font-bold">Query Panel</h2>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Natural Language Query
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="E.g., Show me top 5 products by sales this month"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
          />
          <button
            onClick={handleSubmitQuery}
            disabled={isProcessing || !query.trim()}
            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Generate Chart
              </>
            )}
          </button>
        </div>

        {llmResponse && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">LLM Interpretation</h3>
            <pre className="text-xs text-gray-600 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(llmResponse, null, 2)}
            </pre>
          </div>
        )}

        {llmResponse && cubeData && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">Chart Preview</h3>
            </div>
            <div className="p-4" style={{ height: '250px' }}>
              <ChartRenderer llmResponse={llmResponse} cubeData={cubeData} />
            </div>
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={handleAddToDashboard}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add to Dashboard
              </button>
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-gray-200 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Dashboard Actions</h3>
          
          <button
            onClick={handleCreateNewDashboard}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Dashboard
          </button>

          {activeDashboard && (
            <button
              onClick={handleDeleteDashboard}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Dashboard
            </button>
          )}
        </div>

        {cubeData?.metadata && (
          <div className="text-xs text-gray-500 space-y-1 pt-4 border-t border-gray-200">
            <div className="flex justify-between">
              <span>Records:</span>
              <span className="font-medium">{cubeData.metadata.total}</span>
            </div>
            <div className="flex justify-between">
              <span>Execution Time:</span>
              <span className="font-medium">{cubeData.metadata.executionTime}ms</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN APP
// ============================================================================

const App: React.FC = () => {
  const [state, dispatch] = useReducer(dashboardReducer, {
    dashboards: [],
    activeDashboard: null,
    isLoading: false,
    error: null,
  });

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
    <DashboardContext.Provider value={{ state, dispatch }}>
      <div className="h-screen w-screen flex flex-col bg-gray-100 overflow-hidden">
        <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <BarChart3 className="w-8 h-8" />
              Natural Language Dashboard Generator
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
    </DashboardContext.Provider>
  );
};

export default App;