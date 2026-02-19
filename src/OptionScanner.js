import React, { useState, useEffect } from 'react';
import { fetchYahooOptions } from './yahooOptions';

const Sparkline = ({ data, color = '#00ff88', width = 120, height = 40 }) => {
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
};

export default function OptionScanner() {
  const [symbol, setSymbol] = useState('AAPL');
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchYahooOptions(symbol);
      let items = [];
      if (Array.isArray(data)) {
        data.forEach((entry) => {
          const expiry = entry?.expiration || entry?.date || '';
          const calls = entry?.calls ?? [];
          const puts = entry?.puts ?? [];
          const take = 5;
          calls.slice(0, take).forEach((c) => {
            items.push({ symbol, date: expiry, type: 'CALL', strike: c.strike, premium: c.lastPrice ?? c.bid ?? c.ask ?? 0, oi: c.openInterest ?? 0, trend: Array.from({ length: 12 }, () => (c.lastPrice ?? 1) * (0.92 + Math.random() * 0.16)) });
          });
          puts.slice(0, take).forEach((p) => {
            items.push({ symbol, date: expiry, type: 'PUT', strike: p.strike, premium: p.lastPrice ?? p.bid ?? p.ask ?? 0, oi: p.openInterest ?? 0, trend: Array.from({ length: 12 }, () => (p.lastPrice ?? 1) * (0.92 + Math.random() * 0.16)) });
          });
        });
      }
      setRows(items.slice(0, 40));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Symbol (e.g. AAPL)"
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff' }}
        />
        <button onClick={load} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #333', background: '#111', color: '#fff' }}>
          {loading ? 'Loading…' : 'Fetch'}
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ background: '#0b0f15', borderRadius: 12, border: '1px solid #1b2b2f', padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#9be2a8' }}>{r.symbol} {r.type}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#9bd' }}>{r.date}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'monospace' }}>
              <span>Strike {r.strike}</span>
              <span>${Number(r.premium).toFixed(2)}</span>
            </div>
            <div style={{ marginTop: 8 }}><Sparkline data={r.trend} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'monospace', fontSize: 12 }}>
              <span>OI {r.oi.toLocaleString()}</span>
              <span>ROI ~ {((r.premium / (Number(r.strike) * 100)) * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
