export interface TwitterData {
  username: string
  name: string
  description: string
  followersCount: number
  followingCount: number
  tweetCount: number
  listedCount: number
  verified: boolean
  createdAt: string
  profileImageUrl: string
  websiteUrl: string
  location: string
  error?: string
}

export async function fetchTwitterData(handle: string): Promise<TwitterData> {
  const h = handle.replace('@', '').trim()
  const token = process.env.TWITTER_BEARER_TOKEN
  if (!token) return { username: '', name: '', description: '', followersCount: 0, followingCount: 0, tweetCount: 0, listedCount: 0, verified: false, createdAt: '', profileImageUrl: '', websiteUrl: '', location: '', error: 'Twitter data unavailable' }

  try {
    const res = await fetch(
      `https://api.twitter.com/2/users/by/username/${h}?user.fields=description,public_metrics,verified,created_at,profile_image_url,entities,location`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    if (!res.ok) {
      // If official Twitter API credits are depleted or blocked, check RapidAPI fallback
      const rapidKey = process.env.RAPIDAPI_KEY
      if (rapidKey && rapidKey.length > 15) {
        try {
          const rapidRes = await fetch(
            `https://twitter154.p.rapidapi.com/user/details?username=${encodeURIComponent(h)}`,
            {
              headers: {
                'X-RapidAPI-Key': rapidKey,
                'X-RapidAPI-Host': 'twitter154.p.rapidapi.com',
              },
            }
          )
          if (rapidRes.ok) {
            const rd = await rapidRes.json()
            if (rd && (rd.follower_count != null || rd.followers_count != null)) {
              return {
                username: rd.username || h,
                name: rd.name || h,
                description: rd.description || '',
                followersCount: rd.follower_count ?? rd.followers_count ?? 0,
                followingCount: rd.following_count ?? rd.friends_count ?? 0,
                tweetCount: rd.number_of_tweets ?? rd.statuses_count ?? 0,
                listedCount: rd.listed_count ?? 0,
                verified: Boolean(rd.is_blue_verified || rd.verified),
                createdAt: rd.creation_date || '',
                profileImageUrl: rd.profile_pic_url || rd.profile_image_url_https || '',
                websiteUrl: rd.external_url || '',
                location: rd.location || '',
              }
            }
          }
        } catch {
          // fall through to default error
        }
      }
      return { username: '', name: '', description: '', followersCount: 0, followingCount: 0, tweetCount: 0, listedCount: 0, verified: false, createdAt: '', profileImageUrl: '', websiteUrl: '', location: '', error: 'Twitter data unavailable' }
    }

    const d = await res.json()
    const u = d.data

    return {
      username: u.username || '',
      name: u.name || '',
      description: u.description || '',
      followersCount: u.public_metrics?.followers_count || 0,
      followingCount: u.public_metrics?.following_count || 0,
      tweetCount: u.public_metrics?.tweet_count || 0,
      listedCount: u.public_metrics?.listed_count || 0,
      verified: Boolean(u.verified),
      createdAt: u.created_at || '',
      profileImageUrl: u.profile_image_url || '',
      websiteUrl: u.entities?.url?.urls?.[0]?.expanded_url || '',
      location: u.location || '',
    }
  } catch {
    return { username: '', name: '', description: '', followersCount: 0, followingCount: 0, tweetCount: 0, listedCount: 0, verified: false, createdAt: '', profileImageUrl: '', websiteUrl: '', location: '', error: 'Twitter data unavailable' }
  }
}