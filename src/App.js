import React, { useState, useEffect } from 'react';
import CoveredCallPanel from './CoveredCallPanel';
import CashSecuredPutPanel from './CashSecuredPutPanel';
import OptionScanner from './OptionScanner';

// Minimal, mobile-friendly Robinhood-like shell with three panels
export default function App() {
  const [tab, setTab] = useState('cc'); // cc, csp, scanner

  // PWA install banner state
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // PWA install prompt handling
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    // We could react to 'accepted' or 'dismissed'
    setShowInstallBanner(false);
    setDeferredPrompt(null);
  };

  // Simple global style for a clean app feel on mobile
  useEffect(() => {
    const s = document.createElement('style');
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; background: #0b0e13; color: #e5e5e5; font-family: Inter, system-ui, sans-serif; }
      .app { padding: 14px; }
      .tabbar { display: flex; gap: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }
      .tab { flex: 1; text-align: center; padding: 12px; border-radius: 12px; cursor: pointer; }
      .tab.active { background: #1b9a77; color: white; font-weight: 600; }
      @media (min-width: 800px) { .app { padding: 20px; } }
    `;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  // Renderer switches panels but keeps layout minimal
  return (
    <div className="app" style={{ minHeight: '100vh' }}>
      <div className="tabbar" style={{ marginBottom: 12 }}>
        <div className={"tab" + (tab === 'cc' ? ' active' : '')} onClick={() => setTab('cc')}>
          Covered Call
        </div>
        <div className={"tab" + (tab === 'csp' ? ' active' : '')} onClick={() => setTab('csp')}>
          Cash Secured Put
        </div>
        <div className={"tab" + (tab === 'scanner' ? ' active' : '')} onClick={() => setTab('scanner')}>
          Scanner
        </div>
      </div>

      {tab === 'cc' && <CoveredCallPanel />}
      {tab === 'csp' && <CashSecuredPutPanel />}
      {tab === 'scanner' && <OptionScanner />}

      {showInstallBanner && (
        <div style={{ position: 'fixed', bottom: 12, left: 12, right: 12, display: 'flex', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#0b1', color: '#000', padding: '12px 16px', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'center', boxShadow: '0 6px 20px rgba(0,0,0,0.3)' }}>
            <span style={{ fontWeight: 600 }}>Install Options Desk</span>
            <button onClick={installPWA} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#1fbe6e', color: '#fff', fontWeight: 600 }}>Install</button>
          </div>
        </div>
      )}
    </div>
  );
}
