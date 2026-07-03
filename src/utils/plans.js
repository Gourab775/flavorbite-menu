export function hasFeature(plan, feature) {
  const p = (plan || 'plus').toLowerCase()

  const basicFeatures = [
    'browse_menu',
    'call_waiter',
    'help_support',
    'restaurant_info',
    'faqs',
    'terms_privacy',
  ]

  const plusFeatures = [
    ...basicFeatures,
    'online_ordering',
    'cart',
    'checkout',
    'order_tracking',
    'reviews',
    'feedback',
  ]

  if (p === 'basic') return basicFeatures.includes(feature)
  return plusFeatures.includes(feature)
}
