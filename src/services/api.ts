import { LLMQueryResponse, CubeJsResponse } from '../types';

export const LLMService = {
  async interpretQuery(query: string): Promise<LLMQueryResponse> {
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
        chartOptions: {
          barFillColor: '#10b981', // emerald-500
          xAxisAngle: -45,
        }
      };
    } else if (queryLower.includes('revenue') || queryLower.includes('region')) {
      return {
        metric: 'revenue',
        aggregation: 'sum',
        dimension: 'region',
        chartType: 'pie',
        limit: 6,
        chartOptions: {
          pieColors: ['#f97316', '#ef4444', '#eab308', '#8b5cf6', '#3b82f6', '#10b981'],
          showLegend: true
        }
      };
    } else if (queryLower.includes('trend') || queryLower.includes('over time')) {
      return {
        metric: 'orders',
        aggregation: 'count',
        dimension: 'date',
        chartType: 'line',
        timeframe: 'Last 30 Days',
        limit: 30,
        chartOptions: {
          lineColor: '#dc2626', // red-600
          strokeWidth: 3,
        }
      };
    } else if (queryLower.includes('area') || queryLower.includes('growth')) {
      return {
        metric: 'revenue',
        aggregation: 'sum',
        dimension: 'month',
        chartType: 'area',
        limit: 12,
        chartOptions: {
          areaStrokeColor: '#6366f1',
          areaFillColor: '#818cf8',
        }
      };
    } else {
      return {
        metric: 'orders',
        aggregation: 'count',
        dimension: 'category',
        chartType: 'bar',
        limit: 8,
        chartOptions: {
          barFillColor: '#3b82f6', // blue-500
          xAxisAngle: 0,
        }
      };
    }
  },
};

export const CubeJsService = {
  async executeQuery(llmResponse: LLMQueryResponse): Promise<CubeJsResponse> {
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