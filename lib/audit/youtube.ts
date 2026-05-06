export interface YouTubeVideo {
  id: string
  title: string
  publishedAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  duration: string
  thumbnailUrl: string
}

export interface YouTubeData {
  channelId: string
  title: string
  description: string
  customUrl: string
  publishedAt: string
  country: string
  thumbnailUrl: string
  subscriberCount: number
  videoCount: number
  viewCount: number
  hiddenSubscriberCount: boolean
  recentVideos: YouTubeVideo[]
  uploadFrequencyDays: number
  avgViewsPerVideo: number
  estimatedEngagementRate: number
  error?: string
}

const clean = (h: string) =>
  h.replace(/^https?:\/\/(www\.)?youtube\.com\//, '').replace('@', '').trim()

export async function fetchYouTubeData(handle: string): Promise<YouTubeData> {
  const h = clean(handle)
  const key = process.env.YOUTUBE_API_KEY
  if (!key) return { error: 'YOUTUBE_API_KEY not configured', channelId: '', title: '', description: '', customUrl: '', publishedAt: '', country: '', thumbnailUrl: '', subscriberCount: 0, videoCount: 0, viewCount: 0, hiddenSubscriberCount: false, recentVideos: [], uploadFrequencyDays: 0, avgViewsPerVideo: 0, estimatedEngagementRate: 0 }

  try {
    // Try finding channel by handle/username
    let channelId = ''
    let uploadsPlaylistId = ''

    const byHandleRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails,brandingSettings&forHandle=${h}&key=${key}`
    )
    let byHandleData: any = null
    if (byHandleRes.ok) byHandleData = await byHandleRes.json()

    let channel = byHandleData?.items?.[0]
    if (!channel) {
      // Try by channel id directly
      const byIdRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails,brandingSettings&id=${h}&key=${key}`
      )
      if (byIdRes.ok) {
        const byIdData = await byIdRes.json()
        channel = byIdData?.items?.[0]
      }
    }

    if (!channel) return { error: 'Channel not found', channelId: '', title: '', description: '', customUrl: '', publishedAt: '', country: '', thumbnailUrl: '', subscriberCount: 0, videoCount: 0, viewCount: 0, hiddenSubscriberCount: false, recentVideos: [], uploadFrequencyDays: 0, avgViewsPerVideo: 0, estimatedEngagementRate: 0 }

    channelId = channel.id
    const snippet = channel.snippet || {}
    const stats = channel.statistics || {}
    const contentDetails = channel.contentDetails || {}
    uploadsPlaylistId = contentDetails.relatedPlaylists?.uploads || ''

    // Fetch last 10 videos
    let recentVideos: YouTubeVideo[] = []
    if (uploadsPlaylistId) {
      const plRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${key}`
      )
      if (plRes.ok) {
        const plData = await plRes.json()
        const items = plData?.items || []
        const videoIds = items
          .map((it: any) => it.snippet?.resourceId?.videoId)
          .filter(Boolean)

        if (videoIds.length > 0) {
          const vidRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds.join(',')}&key=${key}`
          )
          if (vidRes.ok) {
            const vidData = await vidRes.json()
            const statsMap: Record<string, any> = {}
            const detailsMap: Record<string, any> = {}
            vidData?.items?.forEach((v: any) => {
              statsMap[v.id] = v.statistics
              detailsMap[v.id] = v.contentDetails
            })

            recentVideos = items.map((it: any) => {
              const vid = it.snippet
              const sid = statsMap[vid.resourceId?.videoId]
              const did = detailsMap[vid.resourceId?.videoId]
              return {
                id: vid.resourceId?.videoId || '',
                title: vid.title || '',
                publishedAt: vid.publishedAt || '',
                viewCount: Number(sid?.viewCount || 0),
                likeCount: Number(sid?.likeCount || 0),
                commentCount: Number(sid?.commentCount || 0),
                duration: did?.duration || '',
                thumbnailUrl: vid.thumbnails?.medium?.url || vid.thumbnails?.default?.url || '',
              }
            })
          }
        }
      }
    }

    // Calculate metrics
    const subscriberCount = Number(stats.subscriberCount || 0)
    const videoCount = Number(stats.videoCount || 0)
    const viewCount = Number(stats.viewCount || 0)

    let uploadFrequencyDays = 0
    if (recentVideos.length >= 2) {
      const first = new Date(recentVideos[0].publishedAt).getTime()
      const last = new Date(recentVideos[recentVideos.length - 1].publishedAt).getTime()
      uploadFrequencyDays = Math.max(1, Math.round((first - last) / (10 * 86400000)))
    }

    const totalViews = recentVideos.reduce((s, v) => s + v.viewCount, 0)
    const avgViewsPerVideo = recentVideos.length > 0 ? Math.round(totalViews / recentVideos.length) : 0

    const totalLikes = recentVideos.reduce((s, v) => s + v.likeCount, 0)
    const totalComments = recentVideos.reduce((s, v) => s + v.commentCount, 0)
    const estimatedEngagementRate = Math.min(100, viewCount > 0 ? ((totalLikes + totalComments) / viewCount) * 100 : 0)

    return {
      channelId,
      title: snippet.title || '',
      description: snippet.description || '',
      customUrl: snippet.customUrl || '',
      publishedAt: snippet.publishedAt || '',
      country: snippet.country || '',
      thumbnailUrl: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
      subscriberCount,
      videoCount,
      viewCount,
      hiddenSubscriberCount: Boolean(stats.hiddenSubscriberCount),
      recentVideos,
      uploadFrequencyDays,
      avgViewsPerVideo,
      estimatedEngagementRate,
    }
  } catch (e: any) {
    return { error: e.message, channelId: '', title: '', description: '', customUrl: '', publishedAt: '', country: '', thumbnailUrl: '', subscriberCount: 0, videoCount: 0, viewCount: 0, hiddenSubscriberCount: false, recentVideos: [], uploadFrequencyDays: 0, avgViewsPerVideo: 0, estimatedEngagementRate: 0 }
  }
}