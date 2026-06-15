import { useState } from "react";
import { useParams } from "wouter";
import { getStoredSlug } from "../utils/constants";
import { useGoBack } from "../context/NavigationContext";
import { Star, Send, CheckCircle } from "lucide-react";

export function FeedbackPage() {
  const { slug: urlSlug } = useParams();
  const slug = urlSlug || getStoredSlug();
  const basePath = `/${slug}`;

  const searchParams = new URLSearchParams(window.location.search);
  const restaurantId = searchParams.get("restaurant_id");
  const orderId = searchParams.get("order_id");
  const tableId = searchParams.get("table_id");

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const goBack = useGoBack(`${basePath}/menu`);
  const goBackToMenu = useGoBack(basePath);

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="pageLayout">
        <header className="topBar">
          <button className="iconBtn pressable" onClick={goBackToMenu} aria-label="Back">
            ←
          </button>
          <h1 className="topBarTitle">Feedback</h1>
          <div style={{ width: 40 }} />
        </header>
        <main className="feedbackBody">
          <div className="feedbackSuccess">
            <div className="feedbackSuccessIcon"><CheckCircle size={48} strokeWidth={1.5} /></div>
            <h2>Thank You!</h2>
            <p>Your feedback helps us improve the experience.</p>
            <button className="btn primary pressable" onClick={goBackToMenu} style={{ marginTop: 24, padding: "14px 0", width: "100%", maxWidth: 240 }}>
              Back to Menu
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="pageLayout">
      <header className="topBar">
        <button className="iconBtn pressable" onClick={goBack} aria-label="Back">
          ←
        </button>
        <h1 className="topBarTitle">Rate Experience</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="feedbackBody">
        <div className="feedbackPrompt">
          <h2>How was your experience?</h2>
          <p className="feedbackSub">Tap a star to rate</p>
          <div className="feedbackStars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={`feedbackStar ${(hovered || rating) >= star ? "active" : ""}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
              >
                <Star size={36} fill={(hovered || rating) >= star ? "currentColor" : "none"} />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <button className="btn primary pressable" onClick={handleSubmit} style={{ marginTop: 24, padding: "14px 0", width: "100%", maxWidth: 240 }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                Submit
                <Send size={16} />
              </span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
