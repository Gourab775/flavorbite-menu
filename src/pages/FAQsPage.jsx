import { useParams } from "wouter";
import { getStoredSlug } from "../utils/constants";
import { useGoBack } from "../context/NavigationContext";
import { useMenu } from "../hooks/useMenu";

const faqs = [
  {
    q: "How do I place an order?",
    a: "Browse the menu, tap Add on items you want, then tap the cart button at the bottom to review and place your order.",
  },
  {
    q: "Can I modify or cancel my order?",
    a: "Please speak to a staff member directly if you need to modify or cancel an order after it has been placed.",
  },
  {
    q: "How do I call a waiter?",
    a: "Open the hamburger menu and select 'Call Waiter', or use the Call Waiter option from the menu. A staff member will be with you shortly.",
  },
  {
    q: "How do I view my order status?",
    a: "Open the hamburger menu and select 'My Orders' to view your recent order details and status.",
  },
  {
    q: "How do I provide feedback?",
    a: "We'd love to hear from you! Open the hamburger menu and select 'Feedback / Rate Experience' to share your thoughts.",
  },
  {
    q: "Is there a minimum order?",
    a: "Please check with the restaurant staff for any minimum order requirements.",
  },
];

export function FAQsPage() {
  const { slug: urlSlug } = useParams();
  const slug = urlSlug || getStoredSlug();
  const basePath = `/${slug}`;
  const goBack = useGoBack(`${basePath}/menu`);

  return (
    <div className="pageLayout">
      <header className="topBar">
        <button className="iconBtn pressable" onClick={goBack} aria-label="Back">
          ←
        </button>
        <h1 className="topBarTitle">FAQs</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="faqsBody hideScrollbar">
        <div className="faqsContainer">
          {faqs.map((faq, idx) => (
            <details className="faqItem" key={idx}>
              <summary className="faqQuestion">
                <span>{faq.q}</span>
                <span className="faqChevron">▼</span>
              </summary>
              <div className="faqAnswer">
                <p>{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
        <button className="btn primary pressable" onClick={goBack} style={{ width: "100%", padding: "14px 0", marginTop: 16 }}>
          Back to Menu
        </button>
        <div style={{ height: 40 }} />
      </main>
    </div>
  );
}
