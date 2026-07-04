export const PLANS = {
  basic: {
    features: [
      'browse_menu',
      'call_waiter',
      'help_support',
      'restaurant_info',
      'faqs',
      'terms_privacy',
    ],
  },
  plus: {
    features: [
      'browse_menu',
      'call_waiter',
      'help_support',
      'restaurant_info',
      'faqs',
      'terms_privacy',
      'online_ordering',
      'cart',
      'checkout',
      'order_tracking',
      'reviews',
      'feedback',
    ],
  },
}

export const PLAN_LABELS = {
  basic: 'Basic Plan',
  plus: 'Plus Plan',
}

export function getPlanFeatures(plan) {
  const p = (plan || 'plus').toLowerCase().trim()
  return PLANS[p]?.features || PLANS.plus.features
}

export function hasFeature(plan, feature) {
  return getPlanFeatures(plan).includes(feature)
}

export function getDefaultTab(plan) {
  const p = (plan || 'plus').toLowerCase().trim()
  return PLANS[p]?.defaultTab || 'menu'
}
