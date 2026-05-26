import { useLocation, useParams } from "wouter";
import { getStoredSlug } from "../utils/constants";
import { useMenu } from "../hooks/useMenu";
import { MessageCircle, Phone } from "lucide-react";

export function HelpSupportPage() {
  const [, navigate] = useLocation();
  const { slug: urlSlug } = useParams();
  const slug = urlSlug || getStoredSlug();
  const basePath = `/${slug}`;
  const { restaurant } = useMenu();

  return (
    <div className="pageLayout">
      <header className="topBar">
        <button className="iconBtn pressable" onClick={() => navigate(basePath)} aria-label="Back">
          ←
        </button>
        <h1 className="topBarTitle">Help & Support</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="helpSupportBody hideScrollbar">
        <div className="helpSection">
          <div className="helpCard">
            <div className="helpCardIcon">
              <MessageCircle size={24} />
            </div>
            <div className="helpCardText">
              <h3>Speak to Staff</h3>
              <p>For immediate assistance, please call a waiter or speak to any staff member at {restaurant?.name || "the restaurant"}.</p>
            </div>
          </div>
          <div className="helpCard">
            <div className="helpCardIcon">
              <Phone size={24} />
            </div>
            <div className="helpCardText">
              <h3>Contact Restaurant</h3>
              <p>If you need to reach the restaurant directly, please ask a staff member for contact details or visit the counter.</p>
            </div>
          </div>
          <div className="helpCard">
            <div className="helpCardIcon"><MessageCircle size={24} /></div>
            <div className="helpCardText">
              <h3>Using the App</h3>
              <p>Browse the menu, add items to your cart, and place your order. Use the hamburger menu to access all features including calling a waiter and viewing your orders.</p>
            </div>
          </div>
        </div>
        <div style={{ height: 40 }} />
      </main>
    </div>
  );
}
