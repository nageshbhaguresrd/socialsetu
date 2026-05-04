export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '60px 24px',
                  color: '#ccc', fontFamily: 'system-ui', background: '#080812', minHeight: '100vh' }}>
      <h1 style={{ color: '#fff', marginBottom: '8px', fontSize: '2.5rem', fontWeight: 'bold' }}>Privacy Policy</h1>
      <p style={{ color: '#666', marginBottom: '40px' }}>
        Last updated: {new Date().toLocaleDateString('en-IN')}
      </p>
      <p>SocialSetu Digital collects your name, email, and phone number 
      when you submit our contact forms. This information is used solely 
      to contact you about our digital marketing services.</p>
      <h2 style={{ color: '#fff', marginTop: '32px', fontSize: '1.5rem' }}>Data Storage</h2>
      <p>Your data is stored securely and is never sold to third parties. We use industry-standard encryption and security practices.</p>
      <h2 style={{ color: '#fff', marginTop: '32px', fontSize: '1.5rem' }}>Contact</h2>
      <p>For any privacy concerns, email us at hello@socialsetu.com.</p>
    </div>
  )
}
