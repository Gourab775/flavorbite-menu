export function calculateTaxes(subtotal, taxes = []) {
  if (!taxes || taxes.length === 0 || subtotal <= 0) {
    return { totalTax: 0, grandTotal: subtotal || 0, taxBreakdown: [] };
  }

  const enabled = taxes
    .filter((t) => t.is_active)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const taxBreakdown = [];
  let totalTax = 0;

  for (const tax of enabled) {
    const rate = Number(tax.percentage) || 0;
    let amount = 0;

    if (tax.type === "inclusive") {
      amount = Math.round(subtotal * rate / (100 + rate));
    } else {
      amount = Math.round(subtotal * rate / 100);
    }

    totalTax += amount;
    taxBreakdown.push({
      name: tax.name,
      percentage: rate,
      type: tax.type,
      amount,
    });
  }

  const exclusiveTotal = taxBreakdown
    .filter((t) => t.type === "exclusive")
    .reduce((sum, t) => sum + t.amount, 0);

  const grandTotal = subtotal + exclusiveTotal;

  return { totalTax, grandTotal, taxBreakdown };
}
