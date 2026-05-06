import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { AuditReport } from '@/lib/types/audit'

interface AuditPDFData {
  clientName: string
  report: AuditReport
  generatedAt: string
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontSize: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderBottom: '3px solid #6C63FF',
    paddingBottom: 16,
  },
  agencyName: {
    fontSize: 22,
    fontWeight: 700,
    color: '#6C63FF',
  },
  reportTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  clientSection: {
    marginBottom: 20,
  },
  clientName: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1A1A2E',
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: '#6C63FF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
    borderBottom: '1px solid #EEE',
    paddingBottom: 4,
  },
  summaryBox: {
    backgroundColor: '#F8F7FF',
    borderLeft: '4px solid #6C63FF',
    padding: 12,
    marginBottom: 16,
    borderRadius: 4,
  },
  summaryText: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#333',
  },
  scoresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  scoreCard: {
    width: '30%',
    backgroundColor: '#F9F9F9',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1A1A2E',
  },
  scoreLabel: {
    fontSize: 8,
    color: '#666',
    marginTop: 2,
  },
  platformCard: {
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  platformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformName: {
    fontSize: 12,
    fontWeight: 700,
    color: '#1A1A2E',
  },
  gradeBadge: {
    backgroundColor: '#6C63FF',
    color: '#FFF',
    fontSize: 9,
    fontWeight: 700,
    padding: '2 8',
    borderRadius: 10,
  },
  scoreBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: '#6C63FF',
  },
  subSection: {
    marginBottom: 8,
  },
  subSectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: '#333',
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 9,
    color: '#555',
    width: '100%',
    paddingLeft: 8,
    lineHeight: 1.5,
  },
  issueRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    paddingLeft: 4,
  },
  issueNum: {
    fontSize: 9,
    fontWeight: 700,
    color: '#EF4444',
    width: 16,
  },
  issueText: {
    fontSize: 9,
    color: '#555',
    flex: 1,
    lineHeight: 1.5,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  weekCol: {
    width: '47%',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 6,
    padding: 10,
  },
  weekTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#6C63FF',
    marginBottom: 8,
  },
  actionItem: {
    fontSize: 9,
    color: '#555',
    marginBottom: 4,
    lineHeight: 1.4,
  },
  benchGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  benchCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 6,
    padding: 10,
  },
  benchLabel: {
    fontSize: 8,
    color: '#666',
    marginBottom: 4,
  },
  benchValue: {
    fontSize: 11,
    fontWeight: 700,
    color: '#1A1A2E',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 8,
    color: '#999',
  },
})

const gradeColor = (grade: string) => {
  switch (grade) {
    case 'A': return '#10B981'
    case 'B': return '#3B82F6'
    case 'C': return '#F59E0B'
    case 'D': return '#F97316'
    default: return '#EF4444'
  }
}

export async function generateAuditPDF(data: AuditPDFData): Promise<Buffer> {
  const { report } = data

  const overallGrade = (score: number): string => {
    if (score >= 85) return 'A'
    if (score >= 70) return 'B'
    if (score >= 55) return 'C'
    if (score >= 40) return 'D'
    return 'F'
  }

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.agencyName}>SocialSetu Digital</Text>
            <Text style={styles.reportTitle}>Social Media Audit Report</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 10, color: '#666' }}>
              Generated: {new Date(report.generatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* Client */}
        <View style={styles.clientSection}>
          <Text style={styles.clientName}>{data.clientName}</Text>
          <Text style={{ fontSize: 10, color: '#666' }}>
            Overall Score: {report.overallScore}/100 &nbsp;|&nbsp; Grade: {overallGrade(report.overallScore)}
          </Text>
        </View>

        {/* Summary */}
        <Text style={styles.sectionLabel}>Executive Summary</Text>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>{report.summary}</Text>
        </View>

        {/* Score Cards */}
        <Text style={styles.sectionLabel}>Performance Scores</Text>
        <View style={styles.scoresRow}>
          {[
            { label: 'Profile Completeness', val: report.scores.profileCompleteness },
            { label: 'Content Consistency', val: report.scores.contentConsistency },
            { label: 'Engagement Rate', val: report.scores.engagementRate },
            { label: 'Growth Potential', val: report.scores.growthPotential },
            { label: 'Brand Presence', val: report.scores.brandPresence },
          ].map(s => (
            <View key={s.label} style={styles.scoreCard}>
              <Text style={styles.scoreValue}>{s.val}</Text>
              <Text style={styles.scoreLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Platforms */}
        <Text style={styles.sectionLabel}>Platform Analysis</Text>
        {Object.entries(report.platforms || {}).map(([platform, info]) => (
          <View key={platform} style={styles.platformCard}>
            <View style={styles.platformHeader}>
              <Text style={styles.platformName}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Text style={styles.scoreBadge}>{info.score}/100</Text>
                <Text style={{ ...styles.gradeBadge, backgroundColor: gradeColor(info.grade) }}>
                  {info.grade}
                </Text>
              </View>
            </View>

            <View style={styles.subSection}>
              <Text style={styles.subSectionTitle}>Strengths</Text>
              <View style={styles.bulletRow}>
                {info.strengths.slice(0, 3).map((s, i) => (
                  <Text key={i} style={styles.bullet}>• {s}</Text>
                ))}
              </View>
            </View>

            <View style={styles.subSection}>
              <Text style={styles.subSectionTitle}>Weaknesses</Text>
              <View style={styles.bulletRow}>
                {info.weaknesses.slice(0, 3).map((s, i) => (
                  <Text key={i} style={styles.bullet}>• {s}</Text>
                ))}
              </View>
            </View>

            <View style={styles.subSection}>
              <Text style={styles.subSectionTitle}>Quick Wins</Text>
              <View style={styles.bulletRow}>
                {info.quickWins.slice(0, 3).map((s, i) => (
                  <Text key={i} style={styles.bullet}>→ {s}</Text>
                ))}
              </View>
            </View>
          </View>
        ))}

        {/* Top Issues */}
        <Text style={styles.sectionLabel}>Top Issues</Text>
        {report.topIssues.slice(0, 5).map((issue, i) => (
          <View key={i} style={styles.issueRow}>
            <Text style={styles.issueNum}>{i + 1}.</Text>
            <Text style={styles.issueText}>{issue}</Text>
          </View>
        ))}

        {/* 30-Day Action Plan */}
        <Text style={styles.sectionLabel}>30-Day Action Plan</Text>
        <View style={styles.actionGrid}>
          {['week1', 'week2', 'week3', 'week4'].map((week, i) => (
            <View key={week} style={styles.weekCol}>
              <Text style={styles.weekTitle}>Week {i + 1}</Text>
              {(report.thirtyDayActionPlan as any)[week]?.map((action: string, j: number) => (
                <Text key={j} style={styles.actionItem}>→ {action}</Text>
              ))}
            </View>
          ))}
        </View>

        {/* Industry Benchmarks */}
        <Text style={styles.sectionLabel}>Industry Benchmarks</Text>
        <View style={styles.benchGrid}>
          <View style={styles.benchCard}>
            <Text style={styles.benchLabel}>Engagement Rate</Text>
            <Text style={styles.benchValue}>{report.industryBenchmark?.engagementRate || 'N/A'}</Text>
          </View>
          <View style={styles.benchCard}>
            <Text style={styles.benchLabel}>Posting Frequency</Text>
            <Text style={styles.benchValue}>{report.industryBenchmark?.postingFrequency || 'N/A'}</Text>
          </View>
          <View style={styles.benchCard}>
            <Text style={styles.benchLabel}>Follower Growth</Text>
            <Text style={styles.benchValue}>{report.industryBenchmark?.followerGrowthRate || 'N/A'}</Text>
          </View>
        </View>

        {/* Competitive Advantages */}
        <Text style={styles.sectionLabel}>Competitive Advantages</Text>
        {report.competitiveAdvantages?.map((adv, i) => (
          <Text key={i} style={{ ...styles.bullet, paddingLeft: 0, marginBottom: 3 }}>★ {adv}</Text>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>SocialSetu Digital — hello@socialsetu.com — +91 9876543210</Text>
          <Text style={styles.footerText}>Confidential — For client use only</Text>
        </View>
      </Page>
    </Document>
  )

  const { pdf } = await import('@react-pdf/renderer')
  const pdfBytes = await pdf(doc).toBuffer()
  return Buffer.from(pdfBytes)
}