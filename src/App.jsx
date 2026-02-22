import { useState } from 'react'
import { useBreakpoint } from './useBreakpoint'
import { ACC, GB } from './ui'
import CCPanel from './CCPanel'
import CSPanel from './CSPanel'
import WheelPanel from './WheelPanel'
import ManualPanel from './ManualPanel'
import LivePanel from './LivePanel'

function App() {
  const bp = useBreakpoint()
  const [tab, setTab] = useState('live')

  const isDesktop = bp === 'md' || bp === 'lg' || bp === 'xl'

  const tabName = tab === 'cc' ? 'Call' : tab === 'csp' ? 'Put' : tab === 'manual' ? 'Manual' : tab === 'live' ? 'Live' : 'S'

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: '#000000' }}>
      <style>{`
        .nav-pill:hover {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(255,255,255,0.2) !important;
          color: #fff !important;
          transform: translateY(-1px);
        }
        .nav-pill.active:hover {
          background: rgba(0,255,136,0.18) !important;
          border-color: rgba(0,255,136,0.5) !important;
        }
      `}</style>
      <div className="radial-glow" />

      <header style={{
        position: 'sticky',
        top: 0,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 48,
        padding: '0 32px',
        background: 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'absolute', left: 32 }}>
          <span style={{
            fontSize: 32,
            fontWeight: 900,
            color: '#ffffff',
            fontFamily: 'Poppins',
            letterSpacing: -2,
            lineHeight: 1
          }}>S</span>
          <span style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.6)',
            fontFamily: 'Poppins',
            letterSpacing: 0.5,
            marginTop: 2
          }}>trategy</span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setTab('cc')} style={{
            background: tab === 'cc' ? 'rgba(255,255,255,0.12)' : 'transparent',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            color: tab === 'cc' ? '#fff' : 'rgba(255,255,255,0.5)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'Poppins',
            transition: 'all 0.2s'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            Call
          </button>
          <button onClick={() => setTab('csp')} style={{
            background: tab === 'csp' ? 'rgba(255,255,255,0.12)' : 'transparent',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            color: tab === 'csp' ? '#fff' : 'rgba(255,255,255,0.5)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'Poppins',
            transition: 'all 0.2s'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
            Put
          </button>
          <button onClick={() => setTab('wheel')} style={{
            background: tab === 'wheel' ? 'rgba(255,255,255,0.12)' : 'transparent',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            color: tab === 'wheel' ? '#fff' : 'rgba(255,255,255,0.5)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'Poppins',
            transition: 'all 0.2s'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
            S
          </button>
          <button onClick={() => setTab('live')} style={{
            background: tab === 'live' ? 'rgba(255,255,255,0.12)' : 'transparent',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            color: tab === 'live' ? '#fff' : 'rgba(255,255,255,0.5)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'Poppins',
            transition: 'all 0.2s'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Live
          </button>
          <button onClick={() => setTab('manual')} style={{
            background: tab === 'manual' ? 'rgba(255,255,255,0.12)' : 'transparent',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            color: tab === 'manual' ? '#fff' : 'rgba(255,255,255,0.5)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'Poppins',
            transition: 'all 0.2s'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            Manual
          </button>
        </div>

        <div style={{ position: 'absolute', right: 32 }} />
      </header>

      {/* Desktop-only app - mobile nav disabled */}

      {false && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          background: 'transparent',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          zIndex: 100
        }}>
          <button
            onClick={() => setTab('cc')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              background: 'transparent',
              border: 'none',
              color: tab === 'cc' ? ACC : 'rgba(255,255,255,0.5)',
              fontSize: 9,
              fontFamily: 'Poppins',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            {tab === 'cc' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: 2,
                background: ACC,
                boxShadow: `0 0 8px ${ACC}`
              }} />
            )}
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: tab === 'cc' ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${tab === 'cc' ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.1)'}`,
              transition: 'all 0.2s ease'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tab === 'cc' ? ACC : 'rgba(255,255,255,0.5)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </div>
            <span style={{ marginTop: 4, fontWeight: 500 }}>Call</span>
          </button>
          <button
            onClick={() => setTab('csp')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              background: 'transparent',
              border: 'none',
              color: tab === 'csp' ? ACC : 'rgba(255,255,255,0.5)',
              fontSize: 9,
              fontFamily: 'Poppins',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            {tab === 'csp' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: 2,
                background: ACC,
                boxShadow: `0 0 8px ${ACC}`
              }} />
            )}
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: tab === 'csp' ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${tab === 'csp' ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.1)'}`,
              transition: 'all 0.2s ease'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tab === 'csp' ? ACC : 'rgba(255,255,255,0.5)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
            <span style={{ marginTop: 4, fontWeight: 500 }}>Put</span>
          </button>
          <button
            onClick={() => setTab('wheel')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              background: 'transparent',
              border: 'none',
              color: tab === 'wheel' ? ACC : 'rgba(255,255,255,0.5)',
              fontSize: 9,
              fontFamily: 'Poppins',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            {tab === 'wheel' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: 2,
                background: ACC,
                boxShadow: `0 0 8px ${ACC}`
              }} />
            )}
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: tab === 'wheel' ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${tab === 'wheel' ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.1)'}`,
              transition: 'all 0.2s ease'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tab === 'wheel' ? ACC : 'rgba(255,255,255,0.5)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
            </div>
            <span style={{ marginTop: 4, fontWeight: 500 }}>S</span>
          </button>
          <button
            onClick={() => setTab('manual')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              background: 'transparent',
              border: 'none',
              color: tab === 'manual' ? ACC : 'rgba(255,255,255,0.5)',
              fontSize: 9,
              fontFamily: 'Poppins',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            {tab === 'manual' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: 2,
                background: ACC,
                boxShadow: `0 0 8px ${ACC}`
              }} />
            )}
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: tab === 'manual' ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${tab === 'manual' ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.1)'}`,
              transition: 'all 0.2s ease'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tab === 'manual' ? ACC : 'rgba(255,255,255,0.5)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <line x1="8" y1="7" x2="16" y2="7" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
            </div>
            <span style={{ marginTop: 4, fontWeight: 500 }}>Manual</span>
          </button>
          <button
            onClick={() => setTab('live')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              background: 'transparent',
              border: 'none',
              color: tab === 'live' ? ACC : 'rgba(255,255,255,0.5)',
              fontSize: 9,
              fontFamily: 'Poppins',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            {tab === 'live' && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: 2,
                background: ACC,
                boxShadow: `0 0 8px ${ACC}`
              }} />
            )}
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: tab === 'live' ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${tab === 'live' ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.1)'}`,
              transition: 'all 0.2s ease'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tab === 'live' ? ACC : 'rgba(255,255,255,0.5)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span style={{ marginTop: 4, fontWeight: 500 }}>Live</span>
          </button>
        </div>
      )}

      <main style={{
        maxWidth: 1800,
        margin: '0 auto',
        padding: '32px',
        paddingBottom: 40,
        position: 'relative',
        zIndex: 1
      }}>
        {tab === 'wheel' && <WheelPanel key="wheel" bp={bp} />}
        {tab === 'cc' && <CCPanel key="cc" bp={bp} />}
        {tab === 'csp' && <CSPanel key="csp" bp={bp} />}
        {tab === 'manual' && <ManualPanel key="manual" bp={bp} />}
        {tab === 'live' && <LivePanel key="live" bp={bp} />}
      </main>
    </div>
  )
}

export default App
