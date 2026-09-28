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
  h.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace('@', '').trim()

export async function fetchInstagramData(handle: string): Promise<InstagramData> {
  const h = clean(handle)
  const metaToken = process.env.META_GRAPH_ACCESS_TOKEN || process.env.INSTAGRAM_GRAPH_TOKEN
  const businessId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID

  // 1. Option 3: Official Meta Graph API (100% official from Meta, for connected business/creator accounts)
  if (metaToken) {
    try {
      const targetId = businessId || h
      const profileRes = await fetch(
        `https://graph.facebook.com/v19.0/${targetId}?fields=id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website&access_token=${metaToken}`
      )

      if (profileRes.ok) {
        const profile = await profileRes.json()
        const followers = profile.followers_count || 0
        const following = profile.follows_count || 0
        const posts = profile.media_count || 0

        // Fetch recent media to calculate genuine engagement rate
        let avgLikes = 0
        let avgComments = 0
        let engagementRate = 2.5

        try {
          const mediaRes = await fetch(
            `https://graph.facebook.com/v19.0/${profile.id || targetId}/media?fields=like_count,comments_count,timestamp&limit=10&access_token=${metaToken}`
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
          // Keep default engagement rate
        }

        return {
          username: profile.username || h,
          fullName: profile.name || profile.username || h,
          biography: profile.biography || '',
          followersCount: followers,
          followingCount: following,
          postsCount: posts,
          isVerified: false,
          isBusinessAccount: true,
          profilePicUrl: profile.profile_picture_url || '',
          websiteUrl: profile.website || '',
          category: 'Business / Creator',
          avgLikes,
          avgComments,
          estimatedEngagementRate: engagementRate,
          postingFrequency: 'Active (Meta Graph Verified)',
        }
      }
    } catch (metaErr: any) {
      console.warn('[MetaGraphAPI] Failed to fetch live data:', metaErr?.message || metaErr)
    }
  }

  // 2. Optional: RapidAPI (if valid & subscribed)
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
          const estimatedEngagementRate = Math.min(20, followers > 0 ? ((avgLikes + avgComments) / followers) * 100 : 0)

          return {
            username: data.username || h,
            fullName: data.full_name || '',
            biography: data.biography || '',
            followersCount: followers,
            followingCount: data.following_count || 0,
            postsCount: data.media_count || 0,
            isVerified: Boolean(data.is_verified),
            isBusinessAccount: Boolean(data.is_business),
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
    } catch {
      // RapidAPI not available
    }
  }

  // 3. Option 2: Gemini AI Benchmark Engine (Primary engine for cold leads & public audits)
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
    error: 'Using Gemini AI Benchmark Engine',
  }
}