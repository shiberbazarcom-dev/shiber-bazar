/**
 * Shop Verification Tier — auto-computed from existing shop data
 *
 * Tiers:
 *   gold   — verified + review_count ≥ 10 + avg_rating ≥ 4.0
 *   silver — verified + review_count ≥ 3  + avg_rating ≥ 3.0
 *   bronze — verified (any)
 *   null   — not verified
 */

export const TIERS = {
  gold: {
    key: 'gold',
    label: 'গোল্ড',
    emoji: '🥇',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    gradient: 'from-amber-400 to-yellow-500',
    textGradient: 'from-amber-500 to-yellow-600',
    minReviews: 10,
    minRating: 4.0,
  },
  silver: {
    key: 'silver',
    label: 'সিলভার',
    emoji: '🥈',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    gradient: 'from-slate-400 to-gray-500',
    textGradient: 'from-slate-500 to-gray-600',
    minReviews: 3,
    minRating: 3.0,
  },
  bronze: {
    key: 'bronze',
    label: 'ব্রোঞ্জ',
    emoji: '🥉',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    gradient: 'from-orange-400 to-amber-600',
    textGradient: 'from-orange-500 to-amber-700',
    minReviews: 0,
    minRating: 0,
  },
}

/** Returns tier object or null if not verified */
export function getShopTier(shop) {
  if (!shop?.is_verified) return null
  const reviews = shop.review_count || 0
  const rating  = Number(shop.avg_rating) || 0
  if (reviews >= TIERS.gold.minReviews && rating >= TIERS.gold.minRating)   return TIERS.gold
  if (reviews >= TIERS.silver.minReviews && rating >= TIERS.silver.minRating) return TIERS.silver
  return TIERS.bronze
}

/**
 * Progress toward next tier.
 * Returns { nextTier, reviewsNeeded, ratingNeeded, reviewProgress, ratingProgress }
 * or null if already Gold (highest).
 */
export function getTierProgress(shop) {
  const tier = getShopTier(shop)
  const reviews = shop?.review_count || 0
  const rating  = Number(shop?.avg_rating) || 0

  let next = null
  if (!tier)                       next = TIERS.bronze
  else if (tier.key === 'bronze')  next = TIERS.silver
  else if (tier.key === 'silver')  next = TIERS.gold
  else                             return null // already gold

  const reviewsNeeded = Math.max(0, next.minReviews - reviews)
  const ratingNeeded  = Math.max(0, next.minRating - rating)
  const reviewProgress = next.minReviews === 0 ? 100 : Math.min(100, Math.round((reviews / next.minReviews) * 100))
  const ratingProgress = next.minRating  === 0 ? 100 : Math.min(100, Math.round((rating  / next.minRating)  * 100))

  return { nextTier: next, reviewsNeeded, ratingNeeded, reviewProgress, ratingProgress }
}
