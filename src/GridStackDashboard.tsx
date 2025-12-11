// GridStackDashboard.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import type { ReactElement } from "react";

import { GridStack, type GridStackOptions } from "gridstack";
import "gridstack/dist/gridstack.min.css";

import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

/* ============================
   Types
   ============================ */
type WidgetId = string;

export type WidgetMeta = {
  id: WidgetId;
  title: string;
  w?: number; // grid width (columns)
  h?: number; // grid height (rows)
};

/* ============================
   Simple sample ECharts option
   ============================ */
function sampleOption(title = "Series"): EChartsOption {
  return {
    title: { text: title, left: "center" },
    tooltip: {},
    xAxis: { type: "category", data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    yAxis: { type: "value" },
    series: [{ type: "line", data: [150, 230, 224, 218, 135, 147, 260] }],
  };
// return {
//     title: {
//       text: "Title",
//       left: "center",
//       top: "30%",
//       textStyle: {
//         fontSize: 42,
//         fontWeight: 700,
//         color: "#222",
//       },
//       subtext: "Subtitle",
//       subtextStyle: { fontSize: 12, color: "#666" },
//     },
//     // minimal axes / series so ECharts renders a blank canvas with centered title
//     tooltip: { show: false },
//     xAxis: { show: false },
//     yAxis: { show: false },
//     series: [],
//   };
}

/* ============================
   Main component
   ============================ */
const STORAGE_KEY = "gridstack-echarts-dashboard-v1";

/**
 * GridStack + ECharts dashboard using React portals into GridStack DOM elements.
 * Each widget is stored in `widgets` state. We create a GridStack item element
 * and mount a small React subtree inside it with ReactDOM.createRoot so charts
 * are fully React-managed but GridStack controls layout/drag/resize.
 */
export default function GridStackDashboard(): ReactElement {
  // grid options
  const gridOptions: GridStackOptions = useMemo(
    () => ({
      float: false,
      // cellHeight 80px, you can tweak
      cellHeight: 80,
      // keep animation short
      animate: true,
      animateRef: null,
      resizable: {
        handles: "se, sw, nw, ne", // show corner handles
      },
      draggable: {
        handle: ".gs-drag-handle",
      },
      // ensure layout recalculation on window resize
      alwaysShowResizeHandle: false,
    }),
    []
  );

  // ref to the grid container DOM node
  const containerRef = useRef<HTMLDivElement | null>(null);
  // GridStack instance ref
  const gridRef = useRef<GridStack | null>(null);

  // map of widgetId => React root (so we can unmount)
  const rootsRef = useRef<Map<WidgetId, ReturnType<typeof ReactDOM.createRoot>>>(new Map());

  // map of widgetId => echarts component reference (to call resize)
  const chartCompRef = useRef<Map<WidgetId, ReactECharts | null>>(new Map());

  // persisted widgets order & meta in React state
  const [widgets, setWidgets] = useState<WidgetMeta[]>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as WidgetMeta[]) : [
        { id: "w1", title: "Sales", w: 4, h: 3 },
        { id: "w2", title: "Expenses", w: 4, h: 3 },
        { id: "w3", title: "Traffic", w: 4, h: 3 },
      ];
    } catch {
      return [
        { id: "w1", title: "Sales", w: 4, h: 3 },
        { id: "w2", title: "Expenses", w: 4, h: 3 },
        { id: "w3", title: "Traffic", w: 4, h: 3 },
      ];
    }
  });

  // Persist widgets metadata (order/size) to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
    } catch {
      // ignore storage errors
    }
  }, [widgets]);

  /* -------------------------
     Initialize GridStack once
     ------------------------- */
  useEffect(() => {
    if (!containerRef.current) return;
    // init grid
    gridRef.current = GridStack.init(gridOptions, containerRef.current);

    const grid = gridRef.current;

    // When layout changes / resize stops / drag stops -> ensure charts resize
    const resizeCharts = () => {
      // ensure layout is stable before resizing charts
      // call getEchartsInstance().resize() for each registered chart component
      for (const [id, comp] of chartCompRef.current) {
        try {
          comp?.getEchartsInstance()?.resize();
        } catch {
          // ignore chart errors
        }
      }
    };

    // On drag/resize/layout end, refresh grid layout and call resize
    const onChange = () => {
      // allow grid to settle
      setTimeout(() => {
        grid?.compact();
        resizeCharts();
        // persist sizes/order from DOM -> state
        persistFromDomToState();
      }, 0);
    };

    grid.on("change", onChange);
    grid.on("resizestop", onChange);
    grid.on("dragstop", onChange);

return () => {
  grid.off("change");
  grid.off("resizestop");
  grid.off("dragstop");
  grid.destroy(false);
  gridRef.current = null;
};

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridOptions]);

  /* -------------------------
     Helper: persist DOM sizes/order back to widgets state
     ------------------------- */
  const persistFromDomToState = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;

    // fetch items in DOM order
    const domItems = grid.getGridItems(); // returns HTMLElement[]
    const newWidgets: WidgetMeta[] = [];

    domItems.forEach((el) => {
      const id = el.getAttribute("data-gs-id") || el.getAttribute("data-gs-widget-id") || el.getAttribute("data-id");
      if (!id) return;
      const node = el as HTMLElement;
      // GridStack stores w/h in dataset or via getCellWidth/getCellHeight; simplest is to read attributes set by GridStack
      const wAttr = node.getAttribute("gs-w") ?? node.getAttribute("data-gs-width");
      const hAttr = node.getAttribute("gs-h") ?? node.getAttribute("data-gs-height");
      const w = wAttr ? parseInt(wAttr, 10) : undefined;
      const h = hAttr ? parseInt(hAttr, 10) : undefined;

      newWidgets.push({ id, title: id, w, h }); // title will be refreshed below if exists in previous state
    });

    // reconcile titles from previous state (preserve metadata)
    setWidgets((prev) => {
      const byId = new Map(prev.map((w) => [w.id, w]));
      const merged = newWidgets.map((nw) => ({ ...byId.get(nw.id), ...nw } as WidgetMeta));
      // append any missing items from prev
      prev.forEach((p) => {
        if (!merged.find((m) => m.id === p.id)) merged.push(p);
      });
      return merged;
    });
  }, []);

  /* -------------------------
     Render a widget into a GridStack DOM element (portal root)
     ------------------------- */
  // return a small React element that will be mounted inside the grid item
  const WidgetInner: React.FC<{ meta: WidgetMeta }> = ({ meta }) => {
    // store ref to echarts component
    const setChartRef = (comp: ReactECharts | null) => {
      chartCompRef.current.set(meta.id, comp);
    };

    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", padding: 8, borderBottom: "1px solid #f2f2f2" }}>
          <div className="gs-drag-handle" style={{ marginRight: 8, cursor: "grab" }} title="Drag">☰</div>
          <div style={{ fontWeight: 600 }}>{meta.title}</div>
          <div style={{ marginLeft: "auto" }}>
            <button
              onClick={() => {
                // request removal
                removeWidget(meta.id);
              }}
              title="Remove"
              style={{ border: "none", background: "transparent", cursor: "pointer" }}
            >
              ✖
            </button>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 120 }}>
          <ReactECharts
            ref={setChartRef}
            option={sampleOption(meta.title)}
            style={{ width: "100%", height: "100%" }}
            notMerge={true}
            lazyUpdate={true}
          />
        </div>
      </div>
    );
  };

  /* -------------------------
     Sync React widgets to GridStack DOM + mount inner React roots
     ------------------------- */

  // create or update grid items when widgets array changes
  useEffect(() => {
    const grid = gridRef.current;
    const container = containerRef.current;
    if (!grid || !container) return;

    // useful helper: find existing item element by data-id
    const findItemEl = (id: WidgetId): HTMLElement | null => {
      return container.querySelector<HTMLElement>(`.grid-stack-item[data-gs-id="${id}"], .grid-stack-item[data-id="${id}"], .grid-stack-item[data-gs-widget-id="${id}"]`);
    };

    // add missing widgets
    widgets.forEach((w) => {
      const existing = findItemEl(w.id);
      if (!existing) {
        // create element and add to grid
        const el = document.createElement("div");
        el.className = "grid-stack-item";
        // mark id attributes GridStack uses or our own fallback
        el.setAttribute("data-gs-id", w.id);
        el.setAttribute("data-id", w.id);
        if (w.w) el.setAttribute("gs-w", String(w.w));
        if (w.h) el.setAttribute("gs-h", String(w.h));

        const content = document.createElement("div");
        content.className = "grid-stack-item-content";
        el.appendChild(content);

        // add to grid; grid.addWidget will insert DOM and manage cell size
        grid.addWidget(el);

        // mount React subtree into the content div
        const root = ReactDOM.createRoot(content);
        root.render(<WidgetInner meta={w} />);
        rootsRef.current.set(w.id, root);
      } else {
        // existing element: ensure sizes reflect metadata (GridStack may already have it)
        if (w.w || w.h) {
          try {
            grid.update(findItemEl(w.id)!, { w: w.w ?? 1, h: w.h ?? 1 });
          } catch {
            // ignore update errors
          }
        }
        // update the mounted React subtree if needed (we can re-render via root.render)
        const root = rootsRef.current.get(w.id);
        if (root) {
          root.render(<WidgetInner meta={w} />);
        }
      }
    });

    // remove DOM items that are no longer in widgets state
    // collect current DOM items under container
    const currentEls = Array.from(container.querySelectorAll<HTMLElement>(".grid-stack-item"));
    currentEls.forEach((el) => {
      const id = el.getAttribute("data-gs-id") || el.getAttribute("data-id") || el.getAttribute("data-gs-widget-id");
      if (!id) return;
      if (!widgets.find((w) => w.id === id)) {
        // unmount react root if present
        const root = rootsRef.current.get(id);
        if (root) {
          root.unmount();
          rootsRef.current.delete(id);
        }
        // remove from GridStack
        const item = grid.getGridItems().find((it) => it === el);
        try {
          grid.removeWidget(el, true);
        } catch {
          // fallback: remove DOM node
          el.remove();
        }
        // remove stored chart ref
        chartCompRef.current.delete(id);
      }
    });

    // after any DOM mutation, call layout to stabilize
    setTimeout(() => {
      try {
        grid.compact();
        grid.commit(); // commit changes
      } catch {
        // ignore
      }
      // resize charts to new layout
      for (const [, comp] of chartCompRef.current) {
        try {
          comp?.getEchartsInstance()?.resize();
        } catch {}
      }
    }, 0);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgets]);

  /* -------------------------
     Add / remove widget helpers
     ------------------------- */

  const addWidget = useCallback(() => {
    const id = `w${Date.now().toString(36)}`;
    const newWidget: WidgetMeta = { id, title: `Widget ${widgets.length + 1}`, w: 4, h: 3 };
    setWidgets((prev) => [...prev, newWidget]);
    // GridStack item will be created in the effect above on next render
  }, [widgets.length]);

  const removeWidget = useCallback((id: WidgetId) => {
    // remove from React state -> effect will remove DOM & unmount
    setWidgets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  /* -------------------------
     Manual save of layout (DOM -> state) and expose to user
     ------------------------- */
  const handleSaveLayout = useCallback(() => {
    persistFromDomToState();
    // persisted by effect to localStorage
  }, [persistFromDomToState]);

  /* -------------------------
     Cleanup on unmount: unmount roots & destroy grid
     ------------------------- */
  useEffect(() => {
    return () => {
      // unmount all created roots
      for (const root of rootsRef.current.values()) {
        try {
          root.unmount();
        } catch {}
      }
      rootsRef.current.clear();
      // destroy grid
      try {
        gridRef.current?.destroy(false);
      } catch {}
      gridRef.current = null;
    };
  }, []);

  /* -------------------------
     UI
     ------------------------- */
  return (
    <div style={{ padding: 12 }}>
      <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
        <button onClick={addWidget}>Add widget</button>
        <button onClick={handleSaveLayout}>Save layout</button>
        <button onClick={() => { setWidgets([]); }}>Clear</button>
        <button onClick={() => { setWidgets([
          { id: "w1", title: "Sales", w: 4, h: 3 },
          { id: "w2", title: "Expenses", w: 4, h: 3 },
          { id: "w3", title: "Traffic", w: 4, h: 3 },
        ]); }}>Reset</button>
      </div>

      <div ref={containerRef} className="grid-stack" style={{ minHeight: 200 }}>
        {/* GridStack will inject items into this container via grid.addWidget */}
      </div>
    </div>
  );
}
