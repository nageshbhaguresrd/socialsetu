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
  const key = process.env.RAPIDAPI_KEY
  if (!key) return { username: '', fullName: '', biography: '', followersCount: 0, followingCount: 0, postsCount: 0, isVerified: false, isBusinessAccount: false, profilePicUrl: '', websiteUrl: '', category: '', avgLikes: 0, avgComments: 0, estimatedEngagementRate: 0, postingFrequency: 'unknown', error: 'RAPIDAPI_KEY not configured' }

  try {
    const res = await fetch(
      `https://instagram-scraper-api2.p.rapidapi.com/v1/info?username_or_id_or_url=${h}`,
      {
        headers: {
          'X-RapidAPI-Key': key,
          'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com',
        },
      }
    )

    if (res.status === 404) {
      return { username: '', fullName: '', biography: '', followersCount: 0, followingCount: 0, postsCount: 0, isVerified: false, isBusinessAccount: false, profilePicUrl: '', websiteUrl: '', category: '', avgLikes: 0, avgComments: 0, estimatedEngagementRate: 0, postingFrequency: 'unknown', error: 'Profile not found or private' }
    }

    const d = await res.json()
    const data = d.data

    const followers = data?.follower_count || 0
    const avgLikes = data?.avg_likes || 0
    const avgComments = data?.avg_comments || 0
    const estimatedEngagementRate = Math.min(20, followers > 0 ? ((avgLikes + avgComments) / followers) * 100 : 0)

    return {
      username: data?.username || '',
      fullName: data?.full_name || '',
      biography: data?.biography || '',
      followersCount: followers,
      followingCount: data?.following_count || 0,
      postsCount: data?.media_count || 0,
      isVerified: Boolean(data?.is_verified),
      isBusinessAccount: Boolean(data?.is_business),
      profilePicUrl: data?.profile_pic_url || '',
      websiteUrl: data?.external_url || '',
      category: data?.category || '',
      avgLikes,
      avgComments,
      estimatedEngagementRate,
      postingFrequency: 'unknown',
    }
  } catch (e: any) {
    return { username: '', fullName: '', biography: '', followersCount: 0, followingCount: 0, postsCount: 0, isVerified: false, isBusinessAccount: false, profilePicUrl: '', websiteUrl: '', category: '', avgLikes: 0, avgComments: 0, estimatedEngagementRate: 0, postingFrequency: 'unknown', error: e.message }
  }
}