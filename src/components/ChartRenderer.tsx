import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { LLMQueryResponse, CubeJsResponse } from '../types';

const DEFAULT_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

const ChartRenderer: React.FC<{
  llmResponse: LLMQueryResponse;
  cubeData: CubeJsResponse;
}> = ({ llmResponse, cubeData }) => {
  const { chartType, dimension, metric, chartOptions = {} } = llmResponse;
  const data = cubeData.data;

  const tooltipStyle = {
    backgroundColor: '#1f2937', 
    border: 'none', 
    borderRadius: '8px', 
    color: '#fff' 
  };

  switch (chartType) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey={dimension} 
              tick={{ fontSize: 11 }} 
              angle={chartOptions.xAxisAngle ?? -45} 
              textAnchor="end" 
              height={chartOptions.xAxisAngle ? 80 : 40}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar 
              dataKey={metric} 
              fill={chartOptions.barFillColor || "#3b82f6"} 
              radius={[8, 8, 0, 0]} 
            />
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
            <Tooltip contentStyle={tooltipStyle} />
            <Line 
              type="monotone" 
              dataKey={metric} 
              stroke={chartOptions.lineColor || "#8b5cf6"} 
              strokeWidth={chartOptions.strokeWidth || 3} 
              dot={{ fill: chartOptions.lineColor || "#8b5cf6", r: 4 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      );

    case 'pie':
      const colors = chartOptions.pieColors || DEFAULT_COLORS;
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
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            {chartOptions.showLegend && <Legend />}
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
            <Tooltip contentStyle={tooltipStyle} />
            <Area 
              type="monotone" 
              dataKey={metric} 
              stroke={chartOptions.areaStrokeColor || "#3b82f6"} 
              fill={chartOptions.areaFillColor || "#93c5fd"} 
              fillOpacity={0.6} 
            />
          </AreaChart>
        </ResponsiveContainer>
      );

    default:
      return <div className="flex items-center justify-center h-full text-gray-400">Unsupported chart type</div>;
  }
};

export default ChartRenderer;