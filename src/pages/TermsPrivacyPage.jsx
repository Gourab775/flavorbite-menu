import { useParams } from "wouter";
import { getStoredSlug } from "../utils/constants";
import { useGoBack } from "../context/NavigationContext";

export function TermsPrivacyPage() {
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
        <h1 className="topBarTitle">Terms & Privacy</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="termsBody hideScrollbar">
        <div className="termsContainer">
          <section className="termsSection">
            <h2>Terms of Use</h2>
            <p>By using this service, you agree to the following terms. This QR menu ordering system is provided for the convenience of customers to browse menu items and place orders at the restaurant.</p>
            <p>All prices displayed are inclusive of applicable taxes unless stated otherwise. The restaurant reserves the right to modify menu items, prices, and availability without prior notice.</p>
            <p>Once an order is placed, it cannot be modified or cancelled through the app. Please speak to restaurant staff for any changes.</p>
          </section>
          <section className="termsSection">
            <h2>Privacy Policy</h2>
            <p>We respect your privacy. The only information we collect is what is necessary for order processing, including table identification and order details.</p>
            <p>We do not share your personal information with third parties. Your order data is stored securely and used only for the purpose of fulfilling your orders and improving our service.</p>
            <p>By using this service, you consent to the collection and use of information as described in this policy.</p>
          </section>
        </div>
        <button className="btn primary pressable" onClick={goBack} style={{ width: "100%", padding: "14px 0", marginTop: 16 }}>
          Back to Menu
        </button>
        <div style={{ height: 40 }} />
      </main>
    </div>
  );
}
