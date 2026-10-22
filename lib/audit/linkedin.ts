export interface LinkedInData {
  username: string
  companyName: string
  description: string
  followersCount: number
  employeeCount: string
  industry: string
  websiteUrl: string
  isVerified: boolean
  engagementRate: number
  postingFrequency: string
  error?: string
}

const cleanLinkedIn = (h: string) =>
  h.replace(/^https?:\/\/(www\.)?linkedin\.com\/(company|in)\//, '').replace(/\/$/, '').trim()

export async function fetchLinkedInData(handle: string): Promise<LinkedInData> {
  const h = cleanLinkedIn(handle)

  // ─────────────────────────────────────────────────────────────────────────────
  // OPTION 1: RapidAPI LinkedIn Scraper
  // Get key at: https://rapidapi.com → search "LinkedIn Company Data"
  // ─────────────────────────────────────────────────────────────────────────────
  const rapidKey = process.env.RAPIDAPI_KEY
  if (rapidKey && rapidKey.length > 15) {
    try {
      const res = await fetch(
        `https://linkedin-api8.p.rapidapi.com/get-company-by-username?username=${encodeURIComponent(h)}`,
        {
          headers: {
            'X-RapidAPI-Key': rapidKey,
            'X-RapidAPI-Host': 'linkedin-api8.p.rapidapi.com',
          },
        }
      )
      if (res.ok) {
        const data = await res.json()
        if (data && (data.followersCount != null || data.name)) {
          console.log(`[LinkedIn] RapidAPI success for ${h}: ${data.followersCount} followers`)
          return {
            username: h,
            companyName: data.name || h,
            description: data.description || '',
            followersCount: data.followersCount || 0,
            employeeCount: data.staffCount ? `${data.staffCount}` : 'Unknown',
            industry: data.industryName || '',
            websiteUrl: data.websiteUrl || '',
            isVerified: false,
            engagementRate: 0, // LinkedIn doesn't expose engagement publicly
            postingFrequency: 'unknown',
          }
        }
      }
    } catch (err: any) {
      console.warn(`[LinkedIn] RapidAPI failed for ${h}:`, err?.message || err)
    }
  } else {
    console.warn('[LinkedIn] No RapidAPI key configured. Set RAPIDAPI_KEY for live LinkedIn data.')
  }

  // Fallback
  return {
    username: h,
    companyName: '',
    description: '',
    followersCount: 0,
    employeeCount: 'Unknown',
    industry: '',
    websiteUrl: '',
    isVerified: false,
    engagementRate: 0,
    postingFrequency: 'unknown',
    error: 'No live scraper configured — AI benchmark will be used',
  }
}
