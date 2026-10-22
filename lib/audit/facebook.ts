export interface FacebookData {
  pageId: string
  pageName: string
  description: string
  likesCount: number
  followersCount: number
  category: string
  websiteUrl: string
  isVerified: boolean
  avgPostEngagement: number
  postingFrequency: string
  error?: string
}

const cleanFacebook = (h: string) =>
  h.replace(/^https?:\/\/(www\.)?facebook\.com\//, '').replace(/\/$/, '').trim()

export async function fetchFacebookData(handle: string): Promise<FacebookData> {
  const h = cleanFacebook(handle)

  // ─────────────────────────────────────────────────────────────────────────────
  // OPTION 1: Meta Graph API — Public Page fields (no special token needed for basic)
  // ─────────────────────────────────────────────────────────────────────────────
  const metaToken = process.env.META_GRAPH_ACCESS_TOKEN || process.env.INSTAGRAM_GRAPH_TOKEN
  if (metaToken) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${encodeURIComponent(h)}?fields=id,name,description,fan_count,followers_count,category,website,verification_status&access_token=${metaToken}`
      )
      if (res.ok) {
        const data = await res.json()
        if (data && data.id && !data.error) {
          console.log(`[Facebook] Meta Graph success for ${h}: ${data.fan_count} likes`)
          return {
            pageId: data.id,
            pageName: data.name || h,
            description: data.description || '',
            likesCount: data.fan_count || 0,
            followersCount: data.followers_count || data.fan_count || 0,
            category: data.category || '',
            websiteUrl: data.website || '',
            isVerified: data.verification_status === 'blue_verified' || data.verification_status === 'gray_verified',
            avgPostEngagement: 0,
            postingFrequency: 'unknown',
          }
        }
      }
    } catch (err: any) {
      console.warn(`[Facebook] Meta Graph API failed for ${h}:`, err?.message || err)
    }
  } else {
    console.warn('[Facebook] No META_GRAPH_ACCESS_TOKEN configured for Facebook page lookup.')
  }

  // Fallback
  return {
    pageId: '',
    pageName: h,
    description: '',
    likesCount: 0,
    followersCount: 0,
    category: '',
    websiteUrl: '',
    isVerified: false,
    avgPostEngagement: 0,
    postingFrequency: 'unknown',
    error: 'No live data source configured — AI benchmark will be used',
  }
}
