import React, { useState } from 'react';

function calcCC({ stockPrice, strikePrice, targetRoi, budget }) {
  const sp = parseFloat(stockPrice);
  const strike = parseFloat(strikePrice);
  const roi = parseFloat(targetRoi) / 100;
  const bud = parseFloat(budget);
  if ([sp, strike, roi].some((v) => isNaN(v) || v <= 0)) return null;

  const premiumPerShare = roi * (sp || 0);
  const denom = sp - premiumPerShare;
  const roiIfAssigned = denom !== 0 ? ((premiumPerShare + (strike - sp)) / denom) * 100 : null;
  let budgetResult = null;
  if (!isNaN(bud) && bud > 0) {
    const sharesAffordable = Math.floor(bud / sp);
    const contracts = Math.floor(sharesAffordable / 100);
    const sharesUsed = contracts * 100;
    const actualCost = sharesUsed * sp;
    const cashLeftover = bud - actualCost;
    const premiumTotal = sharesUsed * premiumPerShare;
    budgetResult = { sharesAffordable, contracts, sharesUsed, actualCost, cashLeftover, premiumTotal };
  }
  const breakeven = sp - premiumPerShare;
  const maxProfit = premiumPerShare + (strike - sp);
  const protectionPct = (premiumPerShare / sp) * 100;
  const otmPct = ((strike - sp) / sp) * 100;
  return { premiumPerShare, roiIfAssigned, breakeven, maxProfit, protectionPct, otmPct, budgetResult };
}

function Sparkline({ data, color = '#00ff88', width = 120, height = 40 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = (max - min) || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      <polyline fill="none" stroke={color} strokeWidth={2} points={pts} />
    </svg>
  );
}

export default function CoveredCallPanel() {
  const [f, setF] = useState({ stockPrice: '100', strikePrice: '105', targetRoi: '25', budget: '' });
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const r = calcCC(f);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
      <div style={{ background: '#0b0f15', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Position</div>
        <div style={{ display: 'grid', gap: 10 }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Stock Price</div>
            <input value={f.stockPrice} onChange={(e) => set('stockPrice')(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #333', background: '#111', color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Strike Price</div>
            <input value={f.strikePrice} onChange={(e) => set('strikePrice')(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #333', background: '#111', color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Target ROI</div>
            <input value={f.targetRoi} onChange={(e) => set('targetRoi')(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #333', background: '#111', color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Budget</div>
            <input value={f.budget} onChange={(e) => set('budget')(e.target.value)} placeholder="optional" style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #333', background: '#111', color: '#fff' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {r ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div style={{ background: '#0a1d16', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Premium / Share</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#00ff88' }}>${f.premium || '0.00'}</div>
              </div>
              <div style={{ background: '#0a1d16', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>ROI if Assigned</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#00ff88' }}>{((r.roiIfAssigned) ? r.roiIfAssigned : 0).toFixed(2)}%</div>
              </div>
              <div style={{ background: '#0a1d16', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Breakeven</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>${r.breakeven.toFixed(2)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: '#0a1d16', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Max Profit / Share</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>${r.maxProfit.toFixed(2)}</div>
              </div>
              <div style={{ flex: 1, background: '#0a1d16', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Payoff</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>Per Share</div>
              </div>
              <div style={{ flex: 1, background: '#0a1d16', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>OTM</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#00ff88' }}>{(r.otmPct).toFixed(2)}%</div>
              </div>
            </div>
            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Payoff at Expiration (per share)</div>
              <div style={{ height: 140 }}>
                {/* simple payoff chart sample using a tiny inline path */}
                <svg width="100%" height="100%" viewBox="0 0 300 140">
                  <polyline points="0,100 60,80 120,60 180,40 240,20 300,10" fill="none" stroke="#00ff88" strokeWidth="2" />
                </svg>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#9bd' }}>
                Payoff: K ${Number(f.strikePrice).toFixed(0)}
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: 20 }}>Enter inputs to compute</div>
        )}
      </div>
    </div>
  );
}
