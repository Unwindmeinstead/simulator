import { useState } from 'react'

export const G = 'rgba(255,255,255,0.06)'
export const GB = 'rgba(255,255,255,0.12)'
export const GA = 'rgba(0,255,136,0.1)'
export const GAB = 'rgba(0,255,136,0.3)'
export const ACC = '#00ff88'
export const WARN = 'rgba(255,160,80,0.2)'
export const WARN_BORDER = 'rgba(255,160,80,0.5)'
export const RED = '#ff5050'

export function Lbl({ children, style }) {
  return (
    <div style={{
      fontSize: 10,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: '#ffffff',
      fontFamily: 'Poppins',
      fontWeight: 600,
      ...style
    }}>
      {children}
    </div>
  )
}

export function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`nav-pill ${active ? 'active' : ''}`}
      style={{
        background: active ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${active ? 'rgba(0,255,136,0.4)' : 'rgba(255,255,255,0.08)'}`,
        color: active ? ACC : 'rgba(255,255,255,0.5)',
        padding: '10px 22px',
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.02em',
        fontFamily: 'Poppins',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        outline: 'none',
        boxShadow: active ? '0 4px 12px rgba(0,255,136,0.15)' : 'none'
      }}
    >
      {children}
    </button>
  )
}

export function NumField({ label, value, onChange, pre, suf, step = 0.01, ph, note, help }) {
  const [showHelp, setShowHelp] = useState(false)
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ marginBottom: 16, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Lbl style={{ fontSize: 10 }}>{label}</Lbl>
        {help && (
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            onMouseEnter={() => setShowHelp(true)}
            onMouseLeave={() => setShowHelp(false)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 10,
              fontFamily: 'Poppins'
            }}
          >
            ?
          </button>
        )}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(0,0,0,0.4)',
        border: `1px solid ${focused ? 'rgba(0,255,136,0.5)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 8,
        padding: '0 14px',
        transition: 'all 0.2s ease',
        height: 44,
        boxShadow: focused ? '0 0 0 2px rgba(0,255,136,0.15)' : 'none'
      }}>
        {pre && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 500 }}>{pre}</span>}
        <input
          type="number"
          step={step}
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={focused ? '' : ph}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#ffffff',
            fontSize: 15,
            fontFamily: 'Poppins',
            padding: '10px 12px',
            width: '100%'
          }}
        />
        {suf && <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{suf}</span>}
      </div>
      {note && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>{note}</div>}
      {showHelp && help && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'rgba(0,0,0,0.95)',
          border: `1px solid ${GB}`,
          borderRadius: 8,
          padding: '12px',
          fontSize: 12,
          color: 'rgba(255,255,255,0.8)',
          lineHeight: 1.5,
          zIndex: 100,
          marginTop: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
        }}>
          {help}
        </div>
      )}
    </div>
  )
}

export function Card({ accent, warn, children, style = {} }) {
  return (
    <div style={{
      background: accent ? 'rgba(0,255,136,0.05)' : warn ? 'rgba(255,160,80,0.05)' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${accent ? 'rgba(0,255,136,0.2)' : warn ? 'rgba(255,160,80,0.2)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 12,
      padding: 20,
      ...style
    }}>
      {children}
    </div>
  )
}

export function KV({ k, v, sub, accent, warn, big }) {
  return (
    <Card accent={accent} warn={warn}>
      <Lbl>{k}</Lbl>
      <div style={{
        fontSize: big ? 22 : 18,
        fontWeight: 700,
        color: accent ? ACC : warn ? '#ffa050' : '#ffffff',
        marginTop: 4,
        fontFamily: 'Poppins'
      }}>
        {v}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{sub}</div>}
    </Card>
  )
}

export function Sep({ label }) {
  if (label) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        <Lbl style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{label}</Lbl>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      </div>
    )
  }
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />
}

export function Badge({ label, value, pos, neutral }) {
  let color = 'rgba(255,255,255,0.6)'
  if (pos === true) color = ACC
  if (pos === false) color = RED
  if (neutral) color = 'rgba(255,255,255,0.7)'

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid rgba(255,255,255,0.08)`,
      borderRadius: 20,
      padding: '6px 12px',
      fontSize: 11,
      fontFamily: 'Poppins'
    }}>
      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>
      <span style={{ color, fontWeight: 700 }}>{value}</span>
    </div>
  )
}
