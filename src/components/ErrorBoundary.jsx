import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (import.meta?.env?.DEV) {
      console.error("UI crashed:", error, info);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          height: "100%",
          padding: 16,
          display: "grid",
          placeItems: "center",
          background: "var(--bg)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 360,
            borderRadius: 18,
            border: "1px solid var(--border)",
            background: "var(--card)",
            padding: 16,
            boxShadow: "var(--shadow-lg)",
            textAlign: "center",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16, color: "var(--text)" }}>Something went wrong</div>
          <div style={{ marginTop: 8, color: "var(--text-secondary)", fontSize: 12 }}>
            Please refresh the page. Your cart is saved.
          </div>
          <button
            style={{
              marginTop: 12,
              width: "100%",
              height: 44,
              borderRadius: 16,
              border: "1px solid var(--accent)",
              background: "var(--accent)",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }
}

