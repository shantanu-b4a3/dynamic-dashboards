export interface LLMQueryResponse {
  metric: string[];
  // aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
  dimension: string[];
  sort?: 'asc' | 'desc';
  limit?: number;
  timeframe?: string;
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | string;
  filters?: Record<string, any>;
  chartOptions?: {
    barFillColor?: string;
    lineColor?: string;
    strokeWidth?: number;
    xAxisAngle?: number;
    showLegend?: boolean;
    pieColors?: string[];
    areaFillColor?: string;
    areaStrokeColor?: string;
    [key: string]: any;
  };
}

export interface CubeJsResponse {
  data: Array<Record<string, any>>;
  metadata?: {
    total: number;
    executionTime: number;
  };
}

export interface ChartWidget {
  id: string;
  title: string;
  query: string;
  llmResponse: LLMQueryResponse;
  chartData: CubeJsResponse;
  position: { x: number; y: number };
  size: { width: number; height: number };
  createdAt: string;
  visible: boolean;
  // 🆕 NEW: Validation state for the widget
  validationState?: 'pending' | 'validated' | 'invalidated';
  validatedAt?: string;
  validationNote?: string;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: ChartWidget[];
  createdAt: string;
  updatedAt: string;
  // 🆕 NEW: Sharing configuration
  sharedWith?: ShareConfig[];
}

// 🆕 NEW: Query history interface
export interface QueryHistory {
  id: string;
  query: string;
  llmResponse: LLMQueryResponse;
  cubeData: CubeJsResponse;
  timestamp: string;
}

// 🆕 NEW: Share configuration interface
export interface ShareConfig {
  id: string;
  email: string;
  name?: string;
  permission: 'view' | 'edit';
  sharedAt: string;
}