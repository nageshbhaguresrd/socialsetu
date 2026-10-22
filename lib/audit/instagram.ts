export interface InstagramData {
  username: string
  fullName: string
  biography: string
  followersCount: number
  followingCount: number
  postsCount: number
  isVerified: boolean
  isBusinessAccount: boolean
  profilePicUrl: string
  websiteUrl: string
  category: string
  avgLikes: number
  avgComments: number
  estimatedEngagementRate: number
  postingFrequency: string
  error?: string
}

const clean = (h: string) =>
  h.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace('@', '').replace(/\/$/, '').trim()

export async function fetchInstagramData(handle: string): Promise<InstagramData> {
  const h = clean(handle)

  // ─────────────────────────────────────────────────────────────────────────────
  // OPTION 1: Meta Graph API — Business Discovery (works for ANY public IG handle)
  // Requires: META_GRAPH_ACCESS_TOKEN (a Page access token with instagram_basic)
  //           INSTAGRAM_BUSINESS_ACCOUNT_ID (your own connected IG Business acct ID)
  // The Business Discovery API lets you look up ANY public IG Business/Creator by username
  // ─────────────────────────────────────────────────────────────────────────────
  const metaToken = process.env.META_GRAPH_ACCESS_TOKEN || process.env.INSTAGRAM_GRAPH_TOKEN
  const ownBusinessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID

  if (metaToken && ownBusinessId) {
    try {
      // Use Business Discovery to look up any public professional IG account by username
      const discoveryRes = await fetch(
        `https://graph.facebook.com/v20.0/${ownBusinessId}?fields=business_discovery.fields(id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website,category){id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website,category}&username=${encodeURIComponent(h)}&access_token=${metaToken}`
      )

      if (discoveryRes.ok) {
        const discoveryData = await discoveryRes.json()
        const profile = discoveryData?.business_discovery

        if (profile && profile.followers_count != null) {
          const followers = profile.followers_count || 0

          // Fetch recent media for genuine engagement
          let avgLikes = 0
          let avgComments = 0
          let engagementRate = 0

          try {
            const mediaRes = await fetch(
              `https://graph.facebook.com/v20.0/${profile.id}/media?fields=like_count,comments_count,timestamp&limit=12&access_token=${metaToken}`
            )
            if (mediaRes.ok) {
              const mediaData = await mediaRes.json()
              const items = mediaData.data || []
              if (items.length > 0) {
                const totalLikes = items.reduce((sum: number, m: any) => sum + (m.like_count || 0), 0)
                const totalComments = items.reduce((sum: number, m: any) => sum + (m.comments_count || 0), 0)
                avgLikes = Math.round(totalLikes / items.length)
                avgComments = Math.round(totalComments / items.length)
                if (followers > 0) {
                  engagementRate = Math.min(20, Number((((avgLikes + avgComments) / followers) * 100).toFixed(2)))
                }
              }
            }
          } catch {
            // Keep zero engagement — better than fake data
          }

          console.log(`[Instagram] Business Discovery success for @${h}: ${followers} followers`)
          return {
            username: profile.username || h,
            fullName: profile.name || h,
            biography: profile.biography || '',
            followersCount: followers,
            followingCount: profile.follows_count || 0,
            postsCount: profile.media_count || 0,
            isVerified: false,
            isBusinessAccount: true,
            profilePicUrl: profile.profile_picture_url || '',
            websiteUrl: profile.website || '',
            category: profile.category || 'Business / Creator',
            avgLikes,
            avgComments,
            estimatedEngagementRate: engagementRate,
            postingFrequency: 'Active (Meta Graph Verified)',
          }
        }
      }
    } catch (metaErr: any) {
      console.warn(`[Instagram] Meta Business Discovery failed for @${h}:`, metaErr?.message || metaErr)
    }
  } else if (metaToken && !ownBusinessId) {
    console.warn('[Instagram] META_GRAPH_ACCESS_TOKEN is set but INSTAGRAM_BUSINESS_ACCOUNT_ID is empty. Business Discovery requires your own IG Business Account ID.')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // OPTION 2: RapidAPI Instagram Scraper (works for ANY public account — no OAuth)
  // Get free key at https://rapidapi.com → search "Instagram Scraper API2"
  // ─────────────────────────────────────────────────────────────────────────────
  const rapidKey = process.env.RAPIDAPI_KEY
  if (rapidKey && rapidKey.length > 15) {
    try {
      const res = await fetch(
        `https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${h}`,
        {
          headers: {
            'X-RapidAPI-Key': rapidKey,
            'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com',
          },
        }
      )
      if (res.ok) {
        const d = await res.json()
        const data = d.data
        if (data && data.follower_count != null) {
          const followers = data.follower_count || 0
          const avgLikes = data.avg_likes || 0
          const avgComments = data.avg_comments || 0
          const estimatedEngagementRate = Math.min(
            20,
            followers > 0 ? ((avgLikes + avgComments) / followers) * 100 : 0
          )

          console.log(`[Instagram] RapidAPI success for @${h}: ${followers} followers`)
          return {
            username: data.username || h,
            fullName: data.full_name || '',
            biography: data.biography || '',
            followersCount: followers,
            followingCount: data.following_count || 0,
            postsCount: data.media_count || 0,
            isVerified: Boolean(data.is_verified),
            isBusinessAccount: Boolean(data.is_business || data.is_professional_account),
            profilePicUrl: data.profile_pic_url || '',
            websiteUrl: data.external_url || '',
            category: data.category || '',
            avgLikes,
            avgComments,
            estimatedEngagementRate,
            postingFrequency: 'unknown',
          }
        }
      }
    } catch (rapidErr: any) {
      console.warn(`[Instagram] RapidAPI failed for @${h}:`, rapidErr?.message || rapidErr)
    }
  } else {
    console.warn('[Instagram] No live data source configured. Set RAPIDAPI_KEY or both META_GRAPH_ACCESS_TOKEN + INSTAGRAM_BUSINESS_ACCOUNT_ID for real data.')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FALLBACK: No live data — signal to Gemini AI to use benchmark analysis
  // ─────────────────────────────────────────────────────────────────────────────
  return {
    username: h,
    fullName: '',
    biography: '',
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    isVerified: false,
    isBusinessAccount: false,
    profilePicUrl: '',
    websiteUrl: '',
    category: '',
    avgLikes: 0,
    avgComments: 0,
    estimatedEngagementRate: 0,
    postingFrequency: 'unknown',
    error: 'No live scraper configured — AI benchmark will be used',
  }
}