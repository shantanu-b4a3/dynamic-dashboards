// MuuriDashboard.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState, type JSX } from "react";
import Muuri from "muuri";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

import './MuuriDashboard.css';
// import 'muuri/dist/muuri.css';

/** -----------------------
 * Types
 * ----------------------- */
type WidgetId = string;
type WidgetMeta = {
  id: WidgetId;
  title: string;
  // any widget config you want; w/h not needed since Muuri flows visually
};

/** -----------------------
 * Constants & defaults
 * ----------------------- */
const STORAGE_KEY = "muuri-dashboard-v1";

const DEFAULT_WIDGETS: WidgetMeta[] = [
  { id: "w1", title: "Sales" },
  { id: "w2", title: "Expenses" },
  { id: "w3", title: "Traffic" },
];

/** -----------------------
 * Helper: sample echarts option
 * ----------------------- */
function sampleOption(title = "Series"): EChartsOption {
  return {
    title: { text: title, left: "center" },
    tooltip: {},
    xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    yAxis: { type: "value" },
    series: [{ type: "line", data: [150, 230, 224, 218, 135, 147, 260] }],
  };
}

/** -----------------------
 * Component
 * ----------------------- */
export default function MuuriDashboard(): JSX.Element {
  // widget list persisted in localStorage
  const [widgets, setWidgets] = useState<WidgetMeta[]>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as WidgetMeta[]) : DEFAULT_WIDGETS;
    } catch {
      return DEFAULT_WIDGETS;
    }
  });

  // reference to grid container DOM node
  const gridRef = useRef<HTMLDivElement | null>(null);
  // Muuri instance ref
  const muuriRef = useRef<Muuri | null>(null);

  // keep map of echarts refs so we can call resize()
  const chartRefs = useRef<Record<WidgetId, ReactECharts | null>>({});

  // initialize Muuri when container mounts
  useEffect(() => {
    if (!gridRef.current) return;

    // create grid
    const grid = new Muuri(gridRef.current, {
      dragEnabled: true,
      dragSort: true,
      dragContainer: document.body,
      layoutOnResize: true,
      // animation options:
      layoutDuration: 250,
    //   dragReleaseDuration: 400,
      // adjust drag handle if you want: dragHandle: '.drag-handle'
    });

    muuriRef.current = grid;

    // When dragging or layout ends, call chart.resize() for each chart to ensure proper rendering
    const onLayoutEnd = () => {
      Object.values(chartRefs.current).forEach((comp) => {
        if (comp && typeof comp.getEchartsInstance === "function") {
          try {
            const inst = comp.getEchartsInstance();
            inst && inst.resize();
          } catch {
            // ignore
          }
        }
      });
      // optionally persist current order
      persistOrder();
    };

    grid.on("layoutEnd", onLayoutEnd);
    grid.on("dragEnd", onLayoutEnd);

    return () => {
      grid.off("layoutEnd", onLayoutEnd);
      grid.off("dragEnd", onLayoutEnd);
      grid.destroy();
      muuriRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist widgets order to storage whenever widgets change
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    } catch {
      // ignore
    }
  }, [widgets]);

  // helper: persist current DOM order of muuri items to widgets state
  const persistOrder = useCallback(() => {
    const grid = muuriRef.current;
    if (!grid) return;

    // get DOM item order
    const items = grid.getItems(); // Muuri.Item[]
    const orderIds: WidgetId[] = items.map((it) => {
      const el = it.getElement();
      return el?.getAttribute("data-id") || "";
    }).filter(Boolean);

    // reorder widgets array to match orderIds
    setWidgets((prev) => {
      const byId = new Map(prev.map((w) => [w.id, w]));
      const next = orderIds.map((id) => byId.get(id)).filter(Boolean) as WidgetMeta[];
      // if some widgets missing (e.g., added programmatically), append them
      const missing = prev.filter((w) => !orderIds.includes(w.id));
      return [...next, ...missing];
    });
  }, []);

  // add widget
  const addWidget = useCallback(() => {
    const id = `w${Date.now().toString(36)}`;
    const newWidget: WidgetMeta = { id, title: `Widget ${widgets.length + 1}` };
    setWidgets((prev) => [...prev, newWidget]);

    // wait for next paint then refresh Muuri items
    requestAnimationFrame(() => {
      muuriRef.current?.refreshItems().layout();
      persistOrder();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgets.length, persistOrder]);

  // remove widget
// inside MuuriDashboard.tsx (TypeScript)
const removeWidget = useCallback((id: WidgetId) => {
  // update React state first
  setWidgets((prev) => prev.filter((w) => w.id !== id));

  // remove the DOM element / muuri item on next frame (after React updates DOM)
  requestAnimationFrame(() => {
    const grid = muuriRef.current;
    if (!grid) return;

    // get current items (Muuri.Item[])
    const items = grid.getItems();
    // find the matching item by its data-id attribute
    const found = items.find((it:any) => it.getElement()?.getAttribute("data-id") === id);

    if (found) {
      // Muuri.remove expects an array of items, so pass [found]
      grid.remove([found], { removeElements: true });
      // refresh items and relayout to keep Muuri state consistent
      grid.refreshItems().layout();
    }
  });
}, []); // you may include muuriRef if your lint rules require it


  // helper to register echarts ref for each widget
  const setChartRef = useCallback((id: WidgetId) => (instance: ReactECharts | null) => {
    chartRefs.current[id] = instance;
  }, []);

  // optional: force layout and resize charts on window resize (extra reliability)
  useEffect(() => {
    const onW = () => {
      muuriRef.current?.layout();
      Object.values(chartRefs.current).forEach((comp) => {
        try { comp?.getEchartsInstance()?.resize(); } catch {}
      });
    };
    window.addEventListener("resize", onW);
    return () => window.removeEventListener("resize", onW);
  }, []);

  // expose a manual save (persistOrder uses DOM order)
  const manualSave = useCallback(() => {
    persistOrder();
    // widgets state is already saved by effect; you could also POST to server here
  }, [persistOrder]);

  /** -----------------------
   * Render
   * ----------------------- */
  return (
    <div className="muuri-dashboard-root">
      <div className="muuri-controls">
        <button onClick={addWidget}>Add</button>
        <button onClick={manualSave} style={{ marginLeft: 8 }}>Save order</button>
        <button onClick={() => { setWidgets(DEFAULT_WIDGETS); muuriRef.current?.remove(muuriRef.current.getItems(), { removeElements: true }); requestAnimationFrame(() => { muuriRef.current?.refreshItems().layout(); }); }} style={{ marginLeft: 8 }}>Reset</button>
      </div>

      <div className="muuri-grid" ref={gridRef}>
        {widgets.map((w) => (
          <div key={w.id} className="muuri-item" data-id={w.id}>
            <div className="muuri-item-content">
              <div className="muuri-item-header">
                <div className="drag-handle" title="Drag">☰</div>
                <div className="muuri-title">{w.title}</div>
                <div style={{ marginLeft: "auto" }}>
                  <button onClick={() => removeWidget(w.id)} title="Remove">✖</button>
                </div>
              </div>

              <div className="muuri-item-body">
                {/* ECharts instance; store ref so we can call resize() later */}
                <ReactECharts
                  ref={setChartRef(w.id)}
                  option={sampleOption(w.title)}
                  style={{ width: "100%", height: "100%" }}
                  notMerge={true}
                  lazyUpdate={true}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
