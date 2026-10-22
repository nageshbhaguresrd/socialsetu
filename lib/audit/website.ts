export interface WebsiteSEOData {
  url: string
  title: string
  description: string
  performanceScore: number
  accessibilityScore: number
  seoScore: number
  bestPracticesScore: number
  firstContentfulPaint: string
  largestContentfulPaint: string
  totalBlockingTime: string
  cumulativeLayoutShift: string
  speedIndex: string
  isMobileOptimized: boolean
  hasSSL: boolean
  error?: string
}

const cleanUrl = (url: string): string => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }
  return url.replace(/\/$/, '').trim()
}

export async function fetchWebsiteSEOData(websiteUrl: string): Promise<WebsiteSEOData> {
  const url = cleanUrl(websiteUrl)
  const pageSpeedKey = process.env.PAGESPEED_API_KEY

  // ─────────────────────────────────────────────────────────────────────────────
  // Google PageSpeed Insights API (Free, 25,000 queries/day with key)
  // Get key: https://console.cloud.google.com → APIs → PageSpeed Insights API
  // ─────────────────────────────────────────────────────────────────────────────
  if (pageSpeedKey) {
    try {
      const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${pageSpeedKey}&category=performance&category=accessibility&category=best-practices&category=seo`
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(20000) })

      if (res.ok) {
        const data = await res.json()
        const cats = data?.lighthouseResult?.categories
        const audits = data?.lighthouseResult?.audits

        const score = (cat: any) => Math.round((cat?.score || 0) * 100)

        console.log(`[Website SEO] PageSpeed success for ${url}: perf=${score(cats?.performance)}`)
        return {
          url,
          title: audits?.['document-title']?.displayValue || '',
          description: audits?.['meta-description']?.displayValue || '',
          performanceScore: score(cats?.performance),
          accessibilityScore: score(cats?.accessibility),
          seoScore: score(cats?.seo),
          bestPracticesScore: score(cats?.['best-practices']),
          firstContentfulPaint: audits?.['first-contentful-paint']?.displayValue || 'N/A',
          largestContentfulPaint: audits?.['largest-contentful-paint']?.displayValue || 'N/A',
          totalBlockingTime: audits?.['total-blocking-time']?.displayValue || 'N/A',
          cumulativeLayoutShift: audits?.['cumulative-layout-shift']?.displayValue || 'N/A',
          speedIndex: audits?.['speed-index']?.displayValue || 'N/A',
          isMobileOptimized: (cats?.performance?.score || 0) >= 0.5,
          hasSSL: url.startsWith('https://'),
        }
      }
    } catch (err: any) {
      console.warn(`[Website SEO] PageSpeed API failed for ${url}:`, err?.message || err)
    }
  } else {
    // Free tier without key — limited to 1 req/sec
    try {
      const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=seo`
      const res = await fetch(apiUrl, { signal: AbortSignal.timeout(20000) })

      if (res.ok) {
        const data = await res.json()
        const cats = data?.lighthouseResult?.categories
        const audits = data?.lighthouseResult?.audits
        const score = (cat: any) => Math.round((cat?.score || 0) * 100)

        console.log(`[Website SEO] PageSpeed (no key) success for ${url}: perf=${score(cats?.performance)}`)
        return {
          url,
          title: audits?.['document-title']?.displayValue || '',
          description: audits?.['meta-description']?.displayValue || '',
          performanceScore: score(cats?.performance),
          accessibilityScore: 0,
          seoScore: score(cats?.seo),
          bestPracticesScore: 0,
          firstContentfulPaint: audits?.['first-contentful-paint']?.displayValue || 'N/A',
          largestContentfulPaint: audits?.['largest-contentful-paint']?.displayValue || 'N/A',
          totalBlockingTime: audits?.['total-blocking-time']?.displayValue || 'N/A',
          cumulativeLayoutShift: audits?.['cumulative-layout-shift']?.displayValue || 'N/A',
          speedIndex: audits?.['speed-index']?.displayValue || 'N/A',
          isMobileOptimized: (cats?.performance?.score || 0) >= 0.5,
          hasSSL: url.startsWith('https://'),
        }
      }
    } catch (err: any) {
      console.warn(`[Website SEO] PageSpeed (no key) failed for ${url}:`, err?.message || err)
    }
  }

  return {
    url,
    title: '',
    description: '',
    performanceScore: 0,
    accessibilityScore: 0,
    seoScore: 0,
    bestPracticesScore: 0,
    firstContentfulPaint: 'N/A',
    largestContentfulPaint: 'N/A',
    totalBlockingTime: 'N/A',
    cumulativeLayoutShift: 'N/A',
    speedIndex: 'N/A',
    isMobileOptimized: url.startsWith('https://'),
    hasSSL: url.startsWith('https://'),
    error: 'Could not fetch website data — AI benchmark will be used',
  }
}
