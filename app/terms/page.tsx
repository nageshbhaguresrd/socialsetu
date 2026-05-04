export default function TermsPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px',
                  color: '#ccc', fontFamily: 'system-ui', background: '#080812', minHeight: '100vh' }}>
      <h1 style={{ color: '#fff', marginBottom: '8px', fontSize: '2.5rem', fontWeight: 'bold' }}>Terms of Service</h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>
        Last updated: {new Date().toLocaleDateString('en-IN')}
      </p>
      <p>By using SocialSetu Digital services, you agree to our Terms of Service. 
      All payments are month-to-month with 18% GST applicable. We reserve the right 
      to pause services for late payments.</p>
      <h2 style={{ color: '#fff', marginTop: '32px', fontSize: '1.5rem' }}>Service Level</h2>
      <p>We guarantee our best efforts towards your marketing goals. Results vary by industry and market conditions.</p>
      <h2 style={{ color: '#fff', marginTop: '32px', fontSize: '1.5rem' }}>Contact</h2>
      <p>For support, email hello@socialsetu.com.</p>
    </div>
  )
}
