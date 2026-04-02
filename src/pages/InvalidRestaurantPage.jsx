import { useLocation } from "wouter";

export function InvalidRestaurantPage() {
  const [, navigate] = useLocation();
  
  return (
    <div className="pageLayout">
      <header className="topBar">
        <h1 className="topBarTitle">Error</h1>
      </header>
      <main className="errorPage">
        <div className="errorContent">
          <h2 className="errorTitle">Invalid QR Code</h2>
          <p className="errorMessage">
            This QR code doesn't appear to be valid. Please scan a fresh QR code from the restaurant.
          </p>
          <button 
            className="errorBtn" 
            onClick={() => navigate("/")}
          >
            Try Again
          </button>
        </div>
      </main>
    </div>
  );
}