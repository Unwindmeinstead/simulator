import { useState } from 'react'

export const G = 'rgba(255,255,255,0.06)'
export const GB = 'rgba(255,255,255,0.12)'
export const GA = 'rgba(0,224,122,0.1)'
export const GAB = 'rgba(0,224,122,0.3)'
export const ACC = '#00ff88'
export const WARN = 'rgba(255,160,80,0.2)'
export const WARN_BORDER = 'rgba(255,160,80,0.5)'
export const RED = '#ff5050'

export function Lbl({ children, style }) {
  return (
    <div style={{
      fontSize: 9.5,
      letterSpacing: '0.13em',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.32)',
      fontFamily: 'JetBrains Mono',
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
      style={{
        background: active ? GA : 'transparent',
        border: `1px solid ${active ? GAB : GB}`,
        color: active ? ACC : 'rgba(255,255,255,0.4)',
        padding: '6px 14px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.05em',
        fontFamily: 'JetBrains Mono',
        cursor: 'pointer',
        transition: 'all 0.15s ease'
      }}
    >
      {children}
    </button>
  )
}

export function NumField({ label, value, onChange, pre, suf, step = 0.01, ph, note, help }) {
  const [showHelp, setShowHelp] = useState(false)
  
  return (
    <div style={{ marginBottom: 14, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Lbl>{label}</Lbl>
        {help && (
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            onMouseEnter={() => setShowHelp(true)}
            onMouseLeave={() => setShowHelp(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer',
              padding: 0,
              width: 14,
              height: 14,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontFamily: 'JetBrains Mono'
            }}
            title="Help"
          >
            ?
          </button>
        )}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: G,
        border: `1px solid ${GB}`,
        borderRadius: 6,
        marginTop: 4,
        padding: '0 10px',
        transition: 'border-color 0.15s ease'
      }}>
        {pre && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{pre}</span>}
        <input
          type="number"
          step={step}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={ph}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#e8e8e8',
            fontSize: 14,
            fontFamily: 'JetBrains Mono',
            padding: '10px 8px',
            width: '100%'
          }}
        />
        {suf && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{suf}</span>}
      </div>
      {note && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{note}</div>}
      {showHelp && help && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'rgba(20,20,25,0.98)',
          border: `1px solid ${GB}`,
          borderRadius: 6,
          padding: '10px 12px',
          fontSize: 11,
          color: 'rgba(255,255,255,0.7)',
          lineHeight: 1.5,
          zIndex: 100,
          marginTop: 4,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
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
      background: accent ? GA : warn ? WARN : G,
      border: `1px solid ${accent ? GAB : warn ? WARN_BORDER : GB}`,
      borderRadius: 10,
      padding: '14px 16px',
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
        color: accent ? ACC : warn ? '#ffa050' : '#e8e8e8',
        marginTop: 2,
        fontFamily: 'JetBrains Mono'
      }}>
        {v}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{sub}</div>}
    </Card>
  )
}

export function Sep({ label }) {
  if (label) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
        <div style={{ flex: 1, height: 1, background: GB }} />
        <Lbl>{label}</Lbl>
        <div style={{ flex: 1, height: 1, background: GB }} />
      </div>
    )
  }
  return <div style={{ height: 1, background: GB, margin: '14px 0' }} />
}

export function Badge({ label, value, pos, neutral }) {
  let color = 'rgba(255,255,255,0.5)'
  if (pos === true) color = ACC
  if (pos === false) color = RED
  if (neutral) color = 'rgba(255,255,255,0.6)'

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: G,
      border: `1px solid ${GB}`,
      borderRadius: 16,
      padding: '4px 10px',
      fontSize: 11,
      fontFamily: 'JetBrains Mono'
    }}>
      <span style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      <span style={{ color, fontWeight: 700 }}>{value}</span>
    </div>
  )
}
