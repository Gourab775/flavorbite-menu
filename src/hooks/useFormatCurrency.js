import { useCallback } from "react";
import { useMenuStore } from "../store/menuStore";
import { DEFAULT_CURRENCY } from "../utils/constants";

export function useFormatCurrency() {
  const { restaurant } = useMenuStore();

  const currencyCode = restaurant.currency_code || DEFAULT_CURRENCY.currency_code;
  const locale = restaurant.locale || DEFAULT_CURRENCY.locale;
  const symbol = restaurant.currency_symbol || DEFAULT_CURRENCY.currency_symbol;

  return useCallback((amount) => {
    if (amount == null || isNaN(amount)) return "";
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${symbol}${Number(amount).toFixed(2)}`;
    }
  }, [currencyCode, locale, symbol]);
}
