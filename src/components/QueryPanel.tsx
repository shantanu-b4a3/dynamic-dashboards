import React, { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Send,
  Plus,
  Trash2,
  ArrowLeftToLine,
  Menu,
  Clock,
  TrendingUp,
  X,
} from "lucide-react";
import { useDashboard } from "../context/DashboardContext";
// import { LLMService, CubeJsService } from '../services/api';
import ChartRenderer from "./ChartRenderer";
import ValidationPanel from "./ValidationPanel";
import { CreateDashboardModal } from "./ModalComponents";
import {
  LLMQueryResponse,
  CubeJsResponse,
  Dashboard,
  ChartWidget,
  QueryHistory,
} from "../types";

interface QueryPanelProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const QueryPanel: React.FC<QueryPanelProps> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const [query, setQuery] = useState("");
  const [llmResponse, setLlmResponse] = useState<LLMQueryResponse | null>(null);
  const [cubeData, setCubeData] = useState<CubeJsResponse | null>(null);
  const [additionalQuestions, setAdditionalQuestions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  // 🆕 NEW: Validation state
  const [validationState, setValidationState] = useState<
    "pending" | "validated" | "invalidated"
  >("pending");
  // 🆕 NEW: Recent queries
  const [recentQueries, setRecentQueries] = useState<QueryHistory[]>([]);
  // 🆕 NEW: Show create dashboard modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  // 🆕 NEW: Confirmation dialog for delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { state, dispatch } = useDashboard();
  const { activeDashboard } = state;

  const ToggleIcon = isCollapsed ? ArrowLeftToLine : Menu;
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 🆕 NEW: Load recent queries from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("recentQueries");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentQueries(parsed.slice(0, 10)); // Keep only last 10
      } catch (e) {
        console.error("Error loading recent queries:", e);
      }
    }
  }, []);

  // 🆕 NEW: Save query to recent queries
  // const saveToRecentQueries = (query: string, llm: LLMQueryResponse, cube: CubeJsResponse) => {
  //   const newQuery: QueryHistory = {
  //     id: `query-${Date.now()}`,
  //     query,
  //     llmResponse: llm,
  //     cubeData: cube,
  //     timestamp: new Date().toISOString(),
  //   };

  //   const updated = [newQuery, ...recentQueries].slice(0, 10);
  //   setRecentQueries(updated);
  //   localStorage.setItem('recentQueries', JSON.stringify(updated));
  // };

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

      const additionalQuestions = apiResponse.additional_questions;
      setAdditionalQuestions(additionalQuestions);

      //Make combined API call here
    } catch (error) {
      console.error("Error processing query:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteRecentQuery = (queryId: string) => {
    // 1. Create a new array that excludes the query with the matching ID
    const updatedQueries = recentQueries.filter(
      (query) => query.id !== queryId
    );

    // 2. Update the state with the new, filtered array
    setRecentQueries(updatedQueries);
    localStorage.setItem("recentQueries", JSON.stringify(updatedQueries));
  };

  // 🆕 NEW: Load a recent query
  const handleLoadRecentQuery = (queryHistory: QueryHistory) => {
    setQuery(queryHistory.query);
    setLlmResponse(queryHistory.llmResponse);
    setCubeData(queryHistory.cubeData);
    setValidationState("pending");
  };

  // 🆕 NEW: Validation handlers
  const handleValidate = (note?: string) => {
    setValidationState("validated");
    console.log("Chart validated:", note);
    // TODO: You can add your validation logic here
  };

  const handleInvalidate = (note?: string) => {
    setValidationState("invalidated");
    console.log("Chart invalidated:", note);
    // TODO: You can add your invalidation logic here

    // Optionally clear the chart after invalidation
    // Uncomment if you want to remove the chart preview
    // setTimeout(() => {
    //   setLlmResponse(null);
    //   setCubeData(null);
    //   setQuery('');
    // }, 2000);
  };

  const handleAddToDashboard = () => {
    if (!llmResponse || !cubeData) return;

    // 🔄 UPDATED: Check validation state before adding
    if (validationState === "invalidated") {
      alert(
        "Cannot add invalidated chart to dashboard. Please validate it first or regenerate the query."
      );
      return;
    }

    if (!activeDashboard) {
      // Show modal instead of prompt
      setShowCreateModal(true);
      return;
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
      visible: true,
      // 🆕 NEW: Save validation state with widget
      validationState,
      validatedAt:
        validationState === "validated" ? new Date().toISOString() : undefined,
    };

    dispatch({ type: "ADD_WIDGET", payload: newWidget });
    setQuery("");
    setLlmResponse(null);
    setCubeData(null);
    setValidationState("pending");
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

  // 🆕 NEW: Create dashboard handler
  const handleCreateDashboard = (name: string, description: string) => {
    const newDashboard: Dashboard = {
      id: `dashboard-${Date.now()}`,
      name,
      description,
      widgets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_DASHBOARD", payload: newDashboard });

    // If we have a pending chart, ask if they want to add it
    if (llmResponse && cubeData && validationState !== "invalidated") {
      setTimeout(() => {
        if (
          confirm(
            "Would you like to add the current chart to this new dashboard?"
          )
        ) {
          handleAddToDashboard();
        }
      }, 300);
    }
  };

  // 🆕 NEW: Delete dashboard with confirmation
  const handleDeleteDashboard = () => {
    if (activeDashboard) {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDeleteDashboard = () => {
    if (activeDashboard) {
      dispatch({ type: "DELETE_DASHBOARD", payload: activeDashboard.id });
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* 🆕 NEW: Create Dashboard Modal */}
      {showCreateModal && (
        <CreateDashboardModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateDashboard}
        />
      )}

      {/* 🆕 NEW: Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Delete Dashboard?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{activeDashboard?.name}"? This
              action cannot be undone. All widgets in this dashboard will be
              permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDashboard}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

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

      {!isCollapsed ? (
        <div ref={containerRef} className="flex-1 overflow-auto p-6 space-y-6">
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
                  disabled={validationState === "invalidated"}
                  className={`w-full font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    validationState === "invalidated"
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  Add to Dashboard
                </button>
                {validationState === "invalidated" && (
                  <p className="text-xs text-red-600 mt-2 text-center">
                    Validate the chart before adding to dashboard
                  </p>
                )}
              </div>
            </div>
          )}

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

          {llmResponse && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Follow Up
              </h3>
              <ul className="list-disc list-inside text-xs text-gray-600">
                {additionalQuestions.length === 0 && (
                  <li>No additional questions available.</li>
                )}
                {additionalQuestions.map((question: string, index: number) => (
                  <li
                    className="m-1 p-1 cursor-pointer"
                    key={index}
                    onClick={() => {
                      setQuery(question);
                      containerRef.current?.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                    }}
                  >
                    {question}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 🆕 NEW: Validation Panel */}
          {llmResponse && cubeData && (
            <ValidationPanel
              validationState={validationState}
              onValidate={handleValidate}
              onInvalidate={handleInvalidate}
            />
          )}

          <div className="pt-6 border-t border-gray-200 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Dashboard Actions
            </h3>

            <button
              onClick={() => setShowCreateModal(true)}
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

          {/* 🆕 NEW: Recent Queries Section */}
          {recentQueries.length > 0 && (
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Recent Queries
              </h3>
              <div className="space-y-2">
                {recentQueries.slice(0, 5).map((queryHistory) => (
                  <div
                    key={queryHistory.id}
                    className="relative group p-0 border border-gray-200 rounded-lg transition-all hover:border-blue-300"
                  >
                    <button
                      onClick={() => handleLoadRecentQuery(queryHistory)}
                      className="w-full text-left p-3 bg-gradient-to-r from-gray-50 to-blue-50 hover:from-gray-100 hover:to-blue-100 rounded-lg pr-10"
                    >
                      <div className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 font-medium truncate group-hover:text-blue-700">
                            {queryHistory.query}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(queryHistory.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </button>
                    <button
                      // NOTE: You must define this function in the parent component
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent the main button's onClick from firing
                        handleDeleteRecentQuery(queryHistory.id);
                      }}
                      // Positioned absolutely on the right edge, slightly centered vertically
                      className="absolute top-1/2 right-3 transform -translate-y-1/2 p-1 rounded-full text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-gray-200 transition-opacity z-10"
                      aria-label={`Delete query: ${queryHistory.query}`}
                    >
                      {/* Assuming you have a Trash/X icon component, e.g., 'X' or 'Trash' */}
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
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
