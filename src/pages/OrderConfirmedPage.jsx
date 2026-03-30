import { useLocation, useParams } from "wouter";

export function OrderConfirmedPage() {
  const [, navigate] = useLocation();
  const { tableId } = useParams();
  const storedTableId = typeof window !== "undefined" ? localStorage.getItem("tableId") : null;
  const currentTableId = tableId || storedTableId;

  const goToMenu = () => {
    navigate(`/t/${currentTableId}`);
  };

  return (
    <div className="pageLayout">
      <header className="topBar">
        <button className="iconBtn pressable" onClick={goToMenu} aria-label="Back to menu">
          ←
        </button>
        <h1 className="topBarTitle">Order Confirmed</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="emptyWrap">
        <div className="emptyIllo" aria-hidden="true">
          ✅
        </div>
        <h2 className="emptyTitle">Order Confirmed!</h2>
        <p className="emptySub">
          Your order has been accepted.<br />
          We will prepare it soon.
        </p>
        <button className="btn primary pressable" onClick={goToMenu} style={{ marginTop: 24 }}>
          Order More
        </button>
      </main>
    </div>
  );
}
