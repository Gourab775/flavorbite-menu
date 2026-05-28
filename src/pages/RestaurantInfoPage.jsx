import { useParams } from "wouter";
import { getStoredSlug } from "../utils/constants";
import { useMenu } from "../hooks/useMenu";
import { getTableData } from "../utils/session";
import { useGoBack } from "../context/NavigationContext";

export function RestaurantInfoPage() {
  const { slug: urlSlug } = useParams();
  const slug = urlSlug || getStoredSlug();
  const basePath = `/${slug}`;
  const goBack = useGoBack(`${basePath}/menu`);
  const { restaurant } = useMenu();
  const tableData = getTableData();

  return (
    <div className="pageLayout">
      <header className="topBar">
        <button className="iconBtn pressable" onClick={goBack} aria-label="Back">
          ←
        </button>
        <h1 className="topBarTitle">Restaurant Info</h1>
        <div style={{ width: 40 }} />
      </header>

      <main className="restaurantInfoBody hideScrollbar">
        <div className="restaurantInfoCard">
          <div className="restaurantInfoLogo">
            {restaurant.logo ? (
              <img src={restaurant.logo} alt={restaurant.name} className="restaurantInfoLogoImg" />
            ) : (
              <span className="restaurantInfoLogoInitial">
                {(restaurant.name || "R").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <h2 className="restaurantInfoName">{restaurant.name || "Restaurant"}</h2>
          {tableData?.table_number && (
            <div className="restaurantInfoTable">Table {tableData.table_number}</div>
          )}
          <div className="restaurantInfoDivider" />
          <div className="restaurantInfoDetail">
            <span className="restaurantInfoLabel">Premium Dining Experience</span>
            <span className="restaurantInfoValue">Scan the QR code at your table to browse the menu and place orders directly from your phone.</span>
          </div>
          <div className="restaurantInfoDetail">
            <span className="restaurantInfoLabel">How to Order</span>
            <span className="restaurantInfoValue">Browse items, add to cart, and proceed to checkout. Your order will be sent directly to the kitchen.</span>
          </div>
        </div>
        <button className="btn primary pressable" onClick={goBack} style={{ width: "100%", padding: "14px 0", marginTop: 16 }}>
          Back to Menu
        </button>
        <div style={{ height: 40 }} />
      </main>
    </div>
  );
}
