import React, { useState, useEffect, useCallback } from "react";
import GridLayout, { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

// sample widgets (replace with charts/components)
function Widget({ id, title, onRemove, children }) {
  return (
    <div className="widget" style={{
      background: "#fff", border: "1px solid #ddd", borderRadius: 8, height: "100%",
      display: "flex", flexDirection: "column", overflow: "hidden"
    }}>
      <div style={{ padding: "8px 10px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <strong>{title}</strong>
        <div>
          <button onClick={() => onRemove(id)} aria-label={`Remove ${title}`} style={{ marginLeft: 8 }}>✖</button>
        </div>
      </div>
      <div style={{ padding: 12, flex: 1, overflow: "auto" }}>
        {children}
      </div>
    </div>
  );
}

const DEFAULT_WIDGETS = [
  { i: "w1", x: 0, y: 0, w: 4, h: 6, title: "Chart A" },
  { i: "w2", x: 4, y: 0, w: 4, h: 6, title: "Chart B" },
  { i: "w3", x: 8, y: 0, w: 4, h: 6, title: "Table" },
];

export default function Dashboard() {
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);
  const [layout, setLayout] = useState(null);

  // load saved layout from localStorage (or fetch from backend)
  useEffect(() => {
    const saved = window.localStorage.getItem("my-dashboard-layout");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWidgets(parsed.widgets || DEFAULT_WIDGETS);
        setLayout(parsed.layout || null);
      } catch (e) {
        console.warn("Invalid saved layout", e);
      }
    }
  }, []);

  // helper to persist layout + widget meta
  const persist = useCallback((nextLayout, nextWidgets) => {
    const payload = { layout: nextLayout, widgets: nextWidgets };
    window.localStorage.setItem("my-dashboard-layout", JSON.stringify(payload));
    // Example server sync — replace URL + method as needed
    fetch("/api/save-dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(err => {
      // handle offline/failure silently or queue for retry
      console.warn("Failed to sync layout to server", err);
    });
  }, []);

  // when layout changes (drag/resize)
  const onLayoutChange = (currentLayout, allLayouts) => {
    // map layout entries to widget ids
    const nextWidgets = widgets.map(w => {
      const item = currentLayout.find(l => l.i === w.i);
      return item ? { ...w, x: item.x, y: item.y, w: item.w, h: item.h } : w;
    });
    setWidgets(nextWidgets);
    setLayout(allLayouts);
    persist(currentLayout, nextWidgets);
  };

  // add new widget
  const addWidget = () => {
    const nextId = `w${Date.now()}`;
    const newWidget = { i: nextId, x: 0, y: Infinity, w: 4, h: 6, title: `Widget ${widgets.length + 1}` };
    const next = [...widgets, newWidget];
    setWidgets(next);
    // you might want to persist after layout settles; we'll persist naive state:
    persist(layout, next);
  };

  // remove a widget
  const removeWidget = (id) => {
    const next = widgets.filter(w => w.i !== id);
    setWidgets(next);
    persist(layout, next);
  };

  // build layout for current breakpoint
  const layoutForBreakpoint = (breakpoint) => {
    return widgets.map(w => ({ i: w.i, x: w.x, y: w.y, w: w.w, h: w.h }));
  };

  const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
  const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };

  return (
    <div style={{ padding: 12, minHeight: "100vh", background: "#f4f6f9" }}>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h2>Dynamic Dashboard</h2>
        <div>
          <button onClick={addWidget} style={{ marginRight: 8 }}>Add widget</button>
          <button onClick={() => {
            window.localStorage.removeItem("my-dashboard-layout");
            setWidgets(DEFAULT_WIDGETS);
            setLayout(null);
          }}>Reset</button>
        </div>
      </header>

      <ResponsiveGridLayout
        className="layout"
        layouts={layout || {}}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={30}
        margin={[12, 12]}
        isResizable={true}
        isDraggable={true}
        useCSSTransforms={true}
        onLayoutChange={onLayoutChange}
        draggableHandle={".widget-handle"} // optional: restrict drag start handle
        // prevent collision: set to false if you want free layout
        compactType="vertical"
      >
        {widgets.map(w => (
          <div key={w.i} data-grid={{ x: w.x, y: w.y, w: w.w, h: w.h }}>
            <Widget id={w.i} title={w.title} onRemove={removeWidget}>
              {/* Replace below with your chart component, e.g. <EChart options={...} /> */}
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{w.title}</div>
                  <div style={{ fontSize: 12 }}>Sample content</div>
                </div>
              </div>
            </Widget>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
