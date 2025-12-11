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
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: ChartWidget[];
  createdAt: string;
  updatedAt: string;
}