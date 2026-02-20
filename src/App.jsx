import { useState } from 'react'
import { useBreakpoint } from './useBreakpoint'
import { Pill, ACC, GB, G } from './ui'
import CCPanel from './CCPanel'
import CSPanel from './CSPPanel'
import WheelPanel from './WheelPanel'
import ManualPanel from './ManualPanel'

function App() {
  const bp = useBreakpoint()
  const [tab, setTab] = useState('wheel')

  const isDesktop = bp === 'md' || bp === 'lg' || bp === 'xl'

  const tabName = tab === 'cc' ? 'Covered Call' : tab === 'csp' ? 'Cash Secured Put' : tab === 'manual' ? 'Manual' : 'Wheel Strategy'

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="radial-glow" />

      <header style={{
        position: 'sticky',
        top: 0,
        height: isDesktop ? 52 : 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isDesktop ? '0 24px' : '0 16px',
        background: '#000000',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${GB}`,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isDesktop ? 12 : 8 }}>
          <span style={{
            color: ACC,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            fontFamily: 'JetBrains Mono'
          }}>
            WHEEL
          </span>
          {isDesktop && (
            <>
              <div style={{ width: 1, height: 20, background: GB }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <Pill active={tab === 'wheel'} onClick={() => setTab('wheel')}>
                  Wheel
                </Pill>
                <Pill active={tab === 'cc'} onClick={() => setTab('cc')}>
                  Covered Call
                </Pill>
                <Pill active={tab === 'csp'} onClick={() => setTab('csp')}>
                  Cash Secured Put
                </Pill>
                <Pill active={tab === 'manual'} onClick={() => setTab('manual')}>
                  Manual
                </Pill>
              </div>
            </>
          )}
        </div>
        <div style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.3)',
          fontFamily: 'JetBrains Mono'
        }}>
          {!isDesktop ? (
            <span style={{ color: ACC, fontSize: 11, fontWeight: 700 }}>
              {tabName}
            </span>
          ) : (
            'Not financial advice'
          )}
        </div>
      </header>

      {!isDesktop && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 72,
          background: '#000000',
          backdropFilter: 'blur(16px)',
          borderTop: `1px solid ${GB}`,
          display: 'flex',
          zIndex: 100
        }}>
          <button
            onClick={() => setTab('wheel')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              background: 'transparent',
              border: 'none',
              color: tab === 'wheel' ? ACC : 'rgba(255,255,255,0.4)',
              fontSize: 9,
              fontFamily: 'JetBrains Mono',
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
                background: ACC
              }} />
            )}
            <span style={{ fontSize: 16 }}>⚙</span>
            <span>Wheel</span>
          </button>
          <button
            onClick={() => setTab('manual')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              background: 'transparent',
              border: 'none',
              color: tab === 'manual' ? ACC : 'rgba(255,255,255,0.4)',
              fontSize: 9,
              fontFamily: 'JetBrains Mono',
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
                background: ACC
              }} />
            )}
            <span style={{ fontSize: 16 }}>📖</span>
            <span>Manual</span>
          </button>
          <button
            onClick={() => setTab('cc')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              background: 'transparent',
              border: 'none',
              color: tab === 'cc' ? ACC : 'rgba(255,255,255,0.4)',
              fontSize: 9,
              fontFamily: 'JetBrains Mono',
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
                background: ACC
              }} />
            )}
            <span style={{ fontSize: 16 }}>↑</span>
            <span>Call</span>
          </button>
          <button
            onClick={() => setTab('csp')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              background: 'transparent',
              border: 'none',
              color: tab === 'csp' ? ACC : 'rgba(255,255,255,0.4)',
              fontSize: 9,
              fontFamily: 'JetBrains Mono',
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
                background: ACC
              }} />
            )}
            <span style={{ fontSize: 16 }}>↓</span>
            <span>Put</span>
          </button>
        </div>
      )}

      <main style={{
        maxWidth: 1020,
        margin: '0 auto',
        padding: isDesktop ? '22px 24px' : '16px 14px',
        paddingBottom: isDesktop ? 40 : 90,
        position: 'relative',
        zIndex: 1
      }}>
        {tab === 'wheel' && <WheelPanel key="wheel" bp={bp} />}
        {tab === 'cc' && <CCPanel key="cc" bp={bp} />}
        {tab === 'csp' && <CSPanel key="csp" bp={bp} />}
        {tab === 'manual' && <ManualPanel key="manual" bp={bp} />}
      </main>
    </div>
  )
}

export default App
