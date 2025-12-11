import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { LLMQueryResponse, CubeJsResponse } from "../types";

const DEFAULT_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
];

const ChartRenderer: React.FC<{
  llmResponse: LLMQueryResponse;
  cubeData: CubeJsResponse;
}> = ({ llmResponse, cubeData }) => {
  const { chartType, dimension, metric, chartOptions = {} } = llmResponse;
  const data = cubeData.data;

  const tooltipStyle = {
    backgroundColor: "#1f2937",
    border: "none",
    borderRadius: "8px",
    color: "#fff",
  };

  switch (chartType) {
    case "Bar":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={dimension[0]}
              tick={{ fontSize: 11 }}
              angle={chartOptions.xAxisAngle ?? -45}
              textAnchor="end"
              height={chartOptions.xAxisAngle ? 80 : 40}
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />

            {
              // dimension.length === 1 ?
              <Bar
                dataKey={metric[0]}
                fill={chartOptions.barFillColor || "#3b82f6"}
                radius={[8, 8, 0, 0]}
              />
              // : dimension.map((dim, index) => <Bar
              //   dataKey={metric[0]}
              //   fill={chartOptions.barFillColor || colors[index % colors.length]}
              //   radius={[8, 8, 0, 0]}
              // />)
            }
          </BarChart>
        </ResponsiveContainer>
      );

    case "Line":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={dimension[0]} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey={metric[0]}
              stroke={chartOptions.lineColor || "#8b5cf6"}
              strokeWidth={chartOptions.strokeWidth || 3}
              dot={{ fill: chartOptions.lineColor || "#8b5cf6", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );

    case "Pie":
      const colors = chartOptions.pieColors || DEFAULT_COLORS;
      const pieData = data.map((item) => ({
        name: item[dimension[0]],
        value: Number(item[metric[0]]),
        dimension: item[dimension[0]],
      }));
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={(entry) => {
                // entry has: name, value, percent, payload, etc.

                return `${entry.name} (${entry.value})`;
              }}
              labelLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
            >
              {pieData.map((ele, index) => (
                <Cell key={ele.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => {
                // name here may be index if nameKey is missing — we have nameKey, but be safe:
                const label =
                  props && props.payload ? props.payload.name : name || "";
                return [value, label]; // [displayValue, displayName]
              }}
              contentStyle={tooltipStyle}
            />
            {chartOptions.showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      );

    case "Area":
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={dimension[0]} tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey={metric[0]}
              stroke={chartOptions.areaStrokeColor || "#3b82f6"}
              fill={chartOptions.areaFillColor || "#93c5fd"}
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      );

    case "KPI":
      return (
        <div className="border border-gray-300 rounded-xl bg-white shadow-sm p-4 flex flex-col gap-1 hover:shadow-md transition-shadow">
          <span className="text-sm text-gray-500 tracking-wide">
            {data[0][dimension[0]]}
          </span>
          <span className="text-3xl font-semibold text-gray-900">
            {data[0][metric[0]]}
          </span>
        </div>
      );

    case "Table":
      {if (!data || data.length === 0) {
        return (
          <div className="text-gray-500 text-sm p-4">No data available</div>
        );
      }

      // Extract all keys as columns (based on first row)
      const columns = Object.keys(data[0]);

      return (
        <div className="overflow-auto border rounded-lg">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-2 border-b text-left font-semibold text-sm text-gray-700"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="odd:bg-white even:bg-gray-50">
                  {columns.map((col) => (
                    <td
                      key={col}
                      className="px-4 py-2 border-b text-sm text-gray-800"
                    >
                      {String(row[col] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    default:
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          Unsupported chart type
        </div>
      );
  }
};

export default ChartRenderer;
