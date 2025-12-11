import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Dashboard, ChartWidget } from '../types';

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

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(dashboardReducer, {
    dashboards: [],
    activeDashboard: null,
    isLoading: false,
    error: null,
  });

  return (
    <DashboardContext.Provider value={{ state, dispatch }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used within DashboardProvider');
  return context;
};