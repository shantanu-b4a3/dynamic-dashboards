import React, { useState } from "react";
import { Loader2, Send, Plus, Trash2, ArrowLeftToLine, Menu } from "lucide-react";
import { useDashboard } from "../context/DashboardContext";
import { LLMService, CubeJsService } from "../services/api";
import ChartRenderer from "./ChartRenderer";
import {
  LLMQueryResponse,
  CubeJsResponse,
  Dashboard,
  ChartWidget,
} from "../types";

interface QueryPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const QueryPanel: React.FC<QueryPanelProps> = ({ isCollapsed, onToggleCollapse}) => {
  const [query, setQuery] = useState("");
  const [llmResponse, setLlmResponse] = useState<LLMQueryResponse | null>(null);
  const [cubeData, setCubeData] = useState<CubeJsResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { state, dispatch } = useDashboard();
  const { activeDashboard } = state;

  const ToggleIcon = isCollapsed ? ArrowLeftToLine : Menu;

  const handleSubmitQuery = async () => {
    if (!query.trim()) return;

    setIsProcessing(true);
    setLlmResponse(null);
    setCubeData(null);

    try {
      const apiResponse = await askApi(query);
      console.log("API Response:", apiResponse);

      const llmResult = {
        chartType: apiResponse.chartType,
        dimension: apiResponse.dimension,
        metric: apiResponse.metric,
      };

      // await LLMService.interpretQuery(query);
      setLlmResponse(llmResult);

      const cubeResult = {
        data: apiResponse.data,
      };
      // await CubeJsService.executeQuery(llmResult);
      setCubeData(cubeResult);

      //Make combined API call here
    } catch (error) {
      console.error("Error processing query:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  async function askApi(question: string) {
    const response = await fetch(
      "https://gimlety-reginia-revolute.ngrok-free.dev/ask",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  const handleAddToDashboard = () => {
    if (!llmResponse || !cubeData) return;

    if (!activeDashboard) {
      const newDashboard: Dashboard = {
        id: `dashboard-${Date.now()}`,
        name: "New Dashboard",
        widgets: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: "ADD_DASHBOARD", payload: newDashboard });
    }

    const widgetCount = activeDashboard?.widgets.length || 0;
    const newWidget: ChartWidget = {
      id: `widget-${Date.now()}`,
      title: `${llmResponse.metric} by ${llmResponse.dimension}`,
      query,
      llmResponse,
      chartData: cubeData,
      position: {
        x: 20 + (widgetCount % 3) * 420,
        y: 20 + Math.floor(widgetCount / 3) * 320,
      },
      size: { width: 400, height: 300 },
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: "ADD_WIDGET", payload: newWidget });
    setQuery("");
    setLlmResponse(null);
    setCubeData(null);
  };

  const handleCreateNewDashboard = () => {
    const name = prompt("Enter dashboard name:");
    if (!name) return;

    const newDashboard: Dashboard = {
      id: `dashboard-${Date.now()}`,
      name,
      widgets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_DASHBOARD", payload: newDashboard });
  };

  const handleDeleteDashboard = () => {
    if (
      activeDashboard &&
      confirm(`Delete dashboard "${activeDashboard.name}"?`)
    ) {
      dispatch({ type: "DELETE_DASHBOARD", payload: activeDashboard.id });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
        {!isCollapsed && (
          <h2 className="text-lg font-bold flex-1 truncate">Query Panel</h2>
        )}
        <button 
          onClick={onToggleCollapse} 
          className="p-1 rounded hover:bg-white/20 transition-colors"
          title={isCollapsed ? "Expand Query Panel" : "Collapse Query Panel"}
        >
          <ToggleIcon className="w-5 h-5" />
        </button>
      </div>

      {!isCollapsed? (
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
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              LLM Interpretation
            </h3>
            <pre className="text-xs text-gray-600 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(llmResponse, null, 2)}
            </pre>
          </div>
        )}

        {llmResponse && cubeData && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">
                Chart Preview
              </h3>
            </div>
            <div className="p-4" style={{ height: "250px" }}>
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
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Dashboard Actions
          </h3>

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
      </div>  
      ):(
        <div className="flex-1 flex items-center justify-center">
          <span className="text-gray-400 text-xs [writing-mode:vertical-rl] transform rotate-180 opacity-70">
            Query Panel
          </span>
        </div>
      )}
    </div>
  );
};

export default QueryPanel;
