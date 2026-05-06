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

    if (!res.ok) return { username: '', name: '', description: '', followersCount: 0, followingCount: 0, tweetCount: 0, listedCount: 0, verified: false, createdAt: '', profileImageUrl: '', websiteUrl: '', location: '', error: 'Twitter data unavailable' }

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