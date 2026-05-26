import { useLocation } from "wouter";
import { Smartphone } from "lucide-react";

export function TableRequiredPage() {
  const [, setLocation] = useLocation();

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const tableId = formData.get("tableId")?.toString().trim();
    if (tableId) {
      setLocation(`/t/${tableId}`);
    }
  };

  return (
    <div className="pageLayout">
      <main className="emptyWrap">
        <div className="emptyIllo" aria-hidden="true">
          <Smartphone size={64} strokeWidth={1} opacity={0.3} />
        </div>
        <h2 className="emptyTitle">Scan QR Code</h2>
        <p className="emptySub">Please scan the QR code from your table to view the menu.</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '200px' }}>
          <input
            type="text"
            name="tableId"
            placeholder="Enter table number"
            required
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(17,24,39,0.1)',
              fontSize: '14px',
              outline: 'none',
              textAlign: 'center',
            }}
          />
          <button type="submit" className="btn primary pressable">
            Continue
          </button>
        </form>
      </main>
    </div>
  );
}
