export function LeadCardSkeleton() {
  return (
    <div style={{
      background: '#0F0F1A',
      border: '1px solid #1A1A2E',
      borderRadius: '12px',
      padding: '16px',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', 
                    marginBottom: '12px' }}>
        <div style={{ width: '140px', height: '16px', 
                      background: '#1A1A2E', borderRadius: '4px' }} />
        <div style={{ width: '60px', height: '20px', 
                      background: '#1A1A2E', borderRadius: '20px' }} />
      </div>
      <div style={{ width: '100px', height: '12px', 
                    background: '#1A1A2E', borderRadius: '4px',
                    marginBottom: '8px' }} />
      <div style={{ width: '120px', height: '12px', 
                    background: '#1A1A2E', borderRadius: '4px' }} />
    </div>
  )
}

export function TableRowSkeleton() {
  return (
    <tr>
      {[140, 100, 80, 90, 70, 80].map((w, i) => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div style={{
            width: `${w}px`, height: '14px',
            background: '#1A1A2E', borderRadius: '4px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
        </td>
      ))}
    </tr>
  )
}
