'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const colors = {
    success: { bg: '#0F2A1A', border: '#2D6A3F', text: '#4ADE80' },
    error:   { bg: '#2A0F0F', border: '#6A2D2D', text: '#F87171' },
    info:    { bg: '#0F0F2A', border: '#2D2D6A', text: '#818CF8' },
  }
  const c = colors[type]

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: '12px', padding: '14px 20px',
      color: c.text, fontSize: '14px', zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      maxWidth: '360px',
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{
        background: 'none', border: 'none', 
        color: c.text, cursor: 'pointer', fontSize: '18px',
        lineHeight: 1, padding: 0,
      }}>×</button>
    </div>
  )
}
