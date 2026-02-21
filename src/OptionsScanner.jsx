import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Target, Zap, Flame, CalendarRange } from 'lucide-react';

// ─── Black-Scholes ────────────────────────────────────────────────────────────
function erf(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1; x = Math.abs(x);
  const t = 1 / (1 + p * x);
  return sign * (1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));
}
const N = x => (1 + erf(x / Math.sqrt(2))) / 2;
const φ = x => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

// Calculate delta from Black-Scholes
function calculateDelta(S, K, T, r, sigma, type) {
  if (T <= 0.0001) return type === "call" ? (S > K ? 1 : 0) : (S < K ? -1 : 0);
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  return type === "call" ? N(d1) : N(d1) - 1;
}

function bs(S, K, T, r, σ, type) {
  if (T <= 0.0001) {
    const iv = type === "call" ? Math.max(0, S - K) : Math.max(0, K - S);
    return { price: iv, delta: type === "call" ? (S > K ? 1 : 0) : (S < K ? -1 : 0), gamma: 0, theta: 0, vega: 0, iv: σ };
  }
  const d1 = (Math.log(S / K) + (r + σ * σ / 2) * T) / (σ * Math.sqrt(T));
  const d2 = d1 - σ * Math.sqrt(T);
  const price = type === "call"
    ? S * N(d1) - K * Math.exp(-r * T) * N(d2)
    : K * Math.exp(-r * T) * N(-d2) - S * N(-d1);
  return {
    price: Math.max(0.01, price),
    delta: type === "call" ? N(d1) : N(d1) - 1,
    gamma: φ(d1) / (S * σ * Math.sqrt(T)),
    theta: type === "call"
      ? (-S * φ(d1) * σ / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * N(d2)) / 365
      : (-S * φ(d1) * σ / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * N(-d2)) / 365,
    vega: S * φ(d1) * Math.sqrt(T) / 100,
    iv: σ,
  };
}

// ─── Watchlist ────────────────────────────────────────────────────────────────
const WATCHLIST = [
  { sym: "AAPL", name: "Apple", price: 178.25, hv: 0.22, sector: "Tech" },
  { sym: "MSFT", name: "Microsoft", price: 415.50, hv: 0.24, sector: "Tech" },
  { sym: "NVDA", name: "NVIDIA", price: 875.40, hv: 0.58, sector: "Semi" },
  { sym: "TSLA", name: "Tesla", price: 172.80, hv: 0.68, sector: "Auto" },
  { sym: "META", name: "Meta", price: 510.20, hv: 0.38, sector: "Tech" },
  { sym: "AMD", name: "AMD", price: 164.85, hv: 0.52, sector: "Semi" },
  { sym: "AMZN", name: "Amazon", price: 194.30, hv: 0.32, sector: "Retail" },
  { sym: "GOOGL", name: "Alphabet", price: 175.60, hv: 0.28, sector: "Tech" },
  { sym: "SPY", name: "S&P 500 ETF", price: 502.70, hv: 0.14, sector: "ETF" },
  { sym: "QQQ", name: "Nasdaq ETF", price: 434.80, hv: 0.18, sector: "ETF" },
  { sym: "COIN", name: "Coinbase", price: 221.60, hv: 0.82, sector: "Crypto" },
  { sym: "PLTR", name: "Palantir", price: 24.80, hv: 0.72, sector: "Tech" },
  { sym: "JPM", name: "JPMorgan", price: 196.40, hv: 0.23, sector: "Finance" },
  { sym: "GLD", name: "Gold ETF", price: 218.40, hv: 0.12, sector: "Comm." },
  { sym: "MSTR", name: "MicroStrategy", price: 1580, hv: 1.12, sector: "Crypto" },
];

const R = 0.053;

function seededRand(seed) {
  let s = seed | 0;
  return () => { s = s * 1664525 + 1013904223 | 0; return (s >>> 0) / 0xffffffff; };
}

function smileIV(K, S, hv, rand) {
  const m = Math.log(K / S);
  return Math.max(0.08, Math.min(1.5, hv * (1 - 0.3 * m + 1.8 * m * m) + (rand() - 0.5) * 0.025));
}

// Returns full chain rows for a stock at a given DTE
function buildRows(stock, dte) {
  const rand = seededRand(stock.sym.charCodeAt(0) * 997 + dte * 31);
  const S = stock.price;
  const T = dte / 365;
  const step = S < 50 ? 1 : S < 200 ? 5 : S < 600 ? 10 : 25;
  const rows = [];
  const exp = new Date(Date.now() + dte * 86400000);
  const expStr = exp.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  for (let i = -9; i <= 9; i++) {
    const K = Math.round((S + i * step * S / 100 * 2) / step) * step;
    if (K <= 0) continue;
    const iv = smileIV(K, S, stock.hv, rand);
    const call = bs(S, K, T, R, iv, "call");
    const put = bs(S, K, T, R, iv, "put");
    const sp = Math.max(0.01, call.price * 0.018);
    const pp = Math.max(0.01, put.price * 0.018);
    const baseVol = Math.floor(rand() * 12000 * Math.exp(-Math.abs(i) * 0.55));
    const chgC = (rand() - 0.45) * call.price * 0.13;
    const chgP = (rand() - 0.45) * put.price * 0.13;
    rows.push({
      sym: stock.sym, name: stock.name, S, K, dte, T, exp, expStr,
      hv: stock.hv, ivRaw: iv, hvRatio: iv / stock.hv,
      call: {
        ...call, bid: Math.max(0.01, call.price - sp), ask: call.price + sp, change: chgC,
        volume: Math.floor(baseVol * (0.6 + rand() * 0.8)), oi: Math.floor(baseVol * (3 + rand() * 9))
      },
      put: {
        ...put, bid: Math.max(0.01, put.price - pp), ask: put.price + pp, change: chgP,
        volume: Math.floor(baseVol * (0.4 + rand() * 1.2)), oi: Math.floor(baseVol * (2 + rand() * 11))
      },
    });
  }
  return rows;
}

// Score a contract for income selling (higher = better opportunity)
function scoreContract(row, type) {
  const opt = row[type];
  const prem = opt.bid;
  const K = row.K;
  const S = row.S;
  const annYield = type === "call"
    ? (prem / S / row.dte) * 365
    : (prem / K / row.dte) * 365;
  const ivEdge = row.hvRatio - 1;
  const d = Math.abs(opt.delta);
  const deltaScore = 1 - Math.abs(d - 0.28) * 3.5;
  const liq = Math.min(1, (opt.volume + 1) / 400);
  const belowPct = type === "csp" ? Math.max(0, (S - K) / S) : Math.max(0, (K - S) / S);

  const raw = annYield * 110 + Math.max(0, ivEdge) * 38 + deltaScore * 18 + liq * 9 + belowPct * 55;
  return {
    score: Math.min(99, Math.max(1, Math.round(raw))),
    annYield, ivEdge,
    breakeven: type === "call" ? S - prem : K - prem,
    protection: prem / S,
    callAway: (K - S) / S,
    belowPct: (S - K) / S,
  };
}

// ─── Scanner ──────────────────────────────────────────────────────────────────
function runScanner({ strategy, minROI, minDTE, maxDTE, minDelta, maxDelta, minVol, minPrice }) {
  try {
    const DTE_SET = [7, 14, 21, 28, 35, 45, 60, 90].filter(d => d >= minDTE && d <= maxDTE);
    if (!DTE_SET.length) return [];

    const results = [];
    for (const stock of WATCHLIST) {
      for (const dte of DTE_SET) {
        const rows = buildRows(stock, dte);
        const maxCallOI = Math.max(...rows.map(r => r.call.oi));
        const maxPutOI = Math.max(...rows.map(r => r.put.oi));

        for (const row of rows) {
          if (strategy === "cc" || strategy === "both") {
            const d = row.call.delta;
            if (d >= minDelta && d <= maxDelta && row.call.volume >= minVol && row.K >= row.S && row.S <= minPrice) {
              const m = scoreContract(row, "call");
              if (m.annYield * 100 >= minROI) {
                results.push({ ...row, type: "CC", side: "call", metrics: m, maxCallOI, maxPutOI });
              }
            }
          }
          if (strategy === "csp" || strategy === "both") {
            const d = Math.abs(row.put.delta);
            if (d >= minDelta && d <= maxDelta && row.put.volume >= minVol && row.K <= row.S && row.S <= minPrice) {
              const m = scoreContract(row, "put");
              if (m.annYield * 100 >= minROI) {
                results.push({ ...row, type: "CSP", side: "put", metrics: m, maxCallOI, maxPutOI });
              }
            }
          }
        }
      }
    }
    const seen = new Set();
    return results
      .sort((a, b) => b.metrics.score - a.metrics.score)
      .filter(r => { const k = `${r.sym}-${r.dte}-${r.K}-${r.type}`; if (seen.has(k)) return false; seen.add(k); return true; });
  } catch (e) {
    console.error('runScanner error:', e);
    return [];
  }
}

// Process real option data from API
function runScannerWithRealData({ strategy, minROI, minDTE, maxDTE, minDelta, maxDelta, minVol, minPrice }, optionData) {
  try {
    const { ticker, currentPrice, options } = optionData;
    
    if (!options || !options.length) return [];
    
    const S = currentPrice;
    const results = [];
    
    for (let optIdx = 0; optIdx < options.length; optIdx++) {
    const opt = options[optIdx];
    const calls = opt.calls || [];
    const puts = opt.puts || [];
    
    // Calculate DTE from expiration
    const expDate = new Date(opt.expirationDate);
    const dte = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (dte < minDTE || dte > maxDTE) continue;
    
    const T = dte / 365;
    const expStr = expDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    const maxCallOI = Math.max(...calls.map(c => c.oi || 0), 1);
    const maxPutOI = Math.max(...puts.map(p => p.oi || 0), 1);
    
    // Process calls
    if (strategy === "cc" || strategy === "both") {
      for (const c of calls) {
        // Calculate delta if not provided
        let delta = parseFloat(c.delta);
        if (isNaN(delta)) {
          const iv = parseFloat(c.impliedVolatility) || 0.3;
          delta = calculateDelta(S, parseFloat(c.strike), T, 0.05, iv, "call");
        }
        const volume = parseInt(c.volume) || 0;
        const bid = parseFloat(c.bid) || 0;
        const ask = parseFloat(c.ask) || 0;
        const mid = (bid + ask) / 2;
        const K = parseFloat(c.strike);
        
        if (delta >= minDelta && delta <= maxDelta && volume >= minVol && K >= S && S <= minPrice) {
          const prem = mid;
          if (prem > 0) {
            const annYield = (prem / S / dte) * 365;
            if (annYield * 100 >= minROI) {
              const iv = parseFloat(c.impliedVolatility) || 0.3;
              results.push({
                sym: ticker, name: ticker, S, K, dte, T, exp: expDate, expStr,
                hv: iv, ivRaw: iv, hvRatio: iv / iv,
                call: { ...c, bid, ask, mid, delta, volume, oi: c.oi || 0 },
                put: null,
                type: "CC", side: "call",
                metrics: {
                  score: Math.round(annYield * 100),
                  annYield, ivEdge: 0,
                  breakeven: S - prem,
                  protection: prem / S,
                  callAway: (K - S) / S,
                  belowPct: (S - K) / S,
                },
                maxCallOI, maxPutOI,
              });
            }
          }
        }
      }
    }
    
    // Process puts
    if (strategy === "csp" || strategy === "both") {
      for (const p of puts) {
        // Calculate delta if not provided
        let delta = parseFloat(p.delta);
        if (isNaN(delta)) {
          const iv = parseFloat(p.impliedVolatility) || 0.3;
          delta = Math.abs(calculateDelta(S, parseFloat(p.strike), T, 0.05, iv, "put"));
        }
        const volume = parseInt(p.volume) || 0;
        const bid = parseFloat(p.bid) || 0;
        const ask = parseFloat(p.ask) || 0;
        const mid = (bid + ask) / 2;
        const K = parseFloat(p.strike);
        
        if (delta >= minDelta && delta <= maxDelta && volume >= minVol && K <= S && S <= minPrice) {
          const prem = mid;
          if (prem > 0) {
            const annYield = (prem / K / dte) * 365;
            if (annYield * 100 >= minROI) {
              const iv = parseFloat(p.impliedVolatility) || 0.3;
              results.push({
                sym: ticker, name: ticker, S, K, dte, T, exp: expDate, expStr,
                hv: iv, ivRaw: iv, hvRatio: iv / iv,
                call: null,
                put: { ...p, bid, ask, mid, delta: -delta, volume, oi: p.oi || 0 },
                type: "CSP", side: "put",
                metrics: {
                  score: Math.round(annYield * 100),
                  annYield, ivEdge: 0,
                  breakeven: K - prem,
                  protection: prem / S,
                  callAway: (K - S) / S,
                  belowPct: (S - K) / S,
                },
                maxCallOI, maxPutOI,
              });
            }
          }
        }
      }
    }
  }
  
  // Sort by score
  const sortedResults = results.sort((a, b) => b.metrics.score - a.metrics.score);
  return sortedResults;
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const f2 = n => n?.toFixed(2) ?? "—";
const f3 = n => n?.toFixed(3) ?? "—";
const fPct = n => (n * 100).toFixed(1) + "%";
const fK = n => n >= 1000000 ? (n / 1e6).toFixed(1) + "M" : n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n ?? 0);
const f$ = n => "$" + f2(n);

// ─── P&L Canvas ───────────────────────────────────────────────────────────────
function PnlChart({ K, S, type, premium, w = 300, h = 90 }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    const spots = Array.from({ length: 100 }, (_, i) => S * (0.75 + i * 0.005));
    const pnls = spots.map(s => (type === "call" ? Math.max(0, s - K) : Math.max(0, K - s) - premium) * 100);
    const min = Math.min(...pnls, -premium * 105), max = Math.max(...pnls, 1);
    const rng = max - min || 1;
    const pad = { l: 6, r: 6, t: 8, b: 6 };
    const cW = w - pad.l - pad.r, cH = h - pad.t - pad.b;
    const xOf = i => pad.l + (i / 99) * cW;
    const yOf = v => pad.t + cH - ((v - min) / rng) * cH;
    const z = yOf(0);
    // Grid zero
    ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(pad.l, z); ctx.lineTo(pad.l + cW, z); ctx.stroke();
    ctx.setLineDash([]);
    // BE marker
    const be = type === "call" ? K + premium : K - premium;
    const beIdx = spots.findIndex(s => s >= be);
    if (beIdx > 0) {
      const bx = xOf(beIdx);
      ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
      ctx.beginPath(); ctx.moveTo(bx, pad.t); ctx.lineTo(bx, pad.t + cH); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,255,255,0.28)"; ctx.font = "9px 'DM Mono',monospace"; ctx.textAlign = "center";
      ctx.fillText("BE", bx, pad.t + 7);
    }
    const col = type === "call" ? "#00c805" : "#ff5000";
    const rgb = type === "call" ? "0,200,5" : "255,80,0";
    // Line
    ctx.beginPath();
    pnls.forEach((v, i) => { const x = xOf(i), y = yOf(v); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();
    // Fills
    const gPos = ctx.createLinearGradient(0, pad.t, 0, z);
    gPos.addColorStop(0, `rgba(${rgb},0.22)`); gPos.addColorStop(1, `rgba(${rgb},0)`);
    ctx.beginPath();
    pnls.forEach((v, i) => { const x = xOf(i), y = yOf(Math.max(0, v)); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.lineTo(xOf(99), z); ctx.lineTo(xOf(0), z); ctx.closePath();
    ctx.fillStyle = gPos; ctx.fill();
    const gNeg = ctx.createLinearGradient(0, z, 0, pad.t + cH);
    gNeg.addColorStop(0, "rgba(255,80,0,0)"); gNeg.addColorStop(1, "rgba(255,80,0,0.14)");
    ctx.beginPath();
    pnls.forEach((v, i) => { const x = xOf(i), y = yOf(Math.min(0, v)); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.lineTo(xOf(99), z); ctx.lineTo(xOf(0), z); ctx.closePath();
    ctx.fillStyle = gNeg; ctx.fill();
    // Spot dot
    const si = spots.findIndex(s => s >= S);
    if (si >= 0) {
      ctx.beginPath(); ctx.arc(xOf(si), yOf(pnls[si]), 3, 0, Math.PI * 2);
      ctx.fillStyle = "#fff"; ctx.fill();
    }
  }, [K, S, type, premium, w, h]);
  return <canvas ref={ref} width={w} height={h} style={{ display: "block" }} />;
}

// ─── OI Bar ───────────────────────────────────────────────────────────────────
function OIBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ width: "100%", height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.4s ease" }} />
    </div>
  );
}

// ─── Score Badge ──────────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  const color = score >= 75 ? "#00c805" : score >= 50 ? "#f59e0b" : "#6b7280";
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono',monospace",
      color, background: `rgba(${score >= 75 ? "0,200,5" : score >= 50 ? "245,158,11" : "107,114,128"},0.12)`,
      padding: "2px 6px", borderRadius: 5, letterSpacing: "0.02em",
    }}>{score}</span>
  );
}

// ─── Inline detail panel (matches options-chain ContractDetail exactly) ────────
function ContractDetail({ result, onClose }) {
  const { type, side, K, S, expStr, dte, sym, metrics, ivRaw, hv } = result;
  const isCC = side === "call";
  const opt = result[side];
  const color = isCC ? "#00c805" : "#ff5000";
  const breakeven = isCC ? S - opt.bid : K - opt.bid;
  const maxProfit = isCC ? `$${((K - S + opt.bid) * 100).toFixed(0)}` : `$${((K - opt.ask) * 100).toFixed(0)}`;
  const maxLoss = `$${(opt.ask * 100).toFixed(0)}`;

  return (
    <div style={{
      background: "#111", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16, padding: 20, marginTop: 2,
      animation: "slideDown 0.18s ease",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: "0.05em",
              background: isCC ? "rgba(0,200,5,0.12)" : "rgba(255,80,0,0.12)", color,
              padding: "3px 10px", borderRadius: 12,
            }}>{type}</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              {sym} ${K} {isCC ? "C" : "P"} · {expStr}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 28, fontWeight: 300, fontFamily: "'DM Mono',monospace", letterSpacing: "-0.03em" }}>
              {f$(opt.ask)}
            </span>
            <span style={{ fontSize: 13, color: opt.change >= 0 ? "#00c805" : "#ff5000", fontFamily: "'DM Mono',monospace" }}>
              {opt.change >= 0 ? "+" : ""}{f2(opt.change)} ({opt.change >= 0 ? "+" : ""}{((opt.change / opt.price) * 100).toFixed(1)}%)
            </span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2, fontFamily: "'DM Mono',monospace" }}>
            Per contract: {f$(opt.ask * 100)} · Ann. return: <span style={{ color: "#00c805", fontWeight: 500 }}>{fPct(metrics.annYield)}</span> · IV/HV: <span style={{ color: metrics.ivEdge > 0.1 ? "#00c805" : "rgba(255,255,255,0.5)" }}>{(ivRaw / hv).toFixed(2)}x</span>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: "rgba(255,255,255,0.07)", border: "none", color: "rgba(255,255,255,0.5)",
          borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>×</button>
      </div>

      {/* P&L Chart */}
      <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 10, padding: "12px 8px 8px", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 4, paddingLeft: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Profit / Loss at Expiration
        </div>
        <PnlChart K={K} S={S} type={side} premium={opt.ask} w={300} h={88} />
        <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 4, paddingInline: 4 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono',monospace" }}>{f$(S * 0.75)}</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontFamily: "'DM Mono',monospace" }}>{f$(S * 1.25)}</span>
        </div>
      </div>

      {/* Key stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Breakeven", val: f$(breakeven), sub: `${(((breakeven - S) / S) * 100).toFixed(1)}% away` },
          { label: "Max Profit", val: maxProfit, sub: "at expiration" },
          { label: "Max Loss", val: maxLoss, sub: "premium paid" },
        ].map(({ label, val, sub }) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 10px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 500, fontFamily: "'DM Mono',monospace" }}>{val}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Greeks */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "14px 10px", marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, textAlign: "center" }}>Greeks</div>
        <div style={{ display: "flex", gap: 4 }}>
          {[
            { l: "Δ Delta", v: f3(opt.delta), c: opt.delta > 0 ? "#00c805" : "#ff5000" },
            { l: "Γ Gamma", v: f3(opt.gamma * 100) + "¢" },
            { l: "Θ Theta", v: f$(opt.theta * 100) + "/d", c: "#ff5000" },
            { l: "V Vega", v: f$(opt.vega * 100) + "/1%", c: "#60a5fa" },
            { l: "IV", v: fPct(ivRaw) },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 5 }}>{l}</div>
              <div style={{ fontSize: 13, fontFamily: "'DM Mono',monospace", color: c || "#fff" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bid/Ask/Volume/OI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1 }}>
        {[
          { label: "Bid", val: f$(opt.bid) },
          { label: "Ask", val: f$(opt.ask) },
          { label: "Volume", val: fK(opt.volume) },
          { label: "Open Int", val: fK(opt.oi) },
        ].map(({ label, val }) => (
          <div key={label} style={{ textAlign: "center", padding: "10px 4px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 13, fontFamily: "'DM Mono',monospace" }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Action */}
      <button style={{
        width: "100%", marginTop: 16, padding: "14px",
        background: color, border: "none", borderRadius: 12,
        color: "#000", fontSize: 15, fontWeight: 700, cursor: "pointer",
        fontFamily: "inherit", letterSpacing: "-0.01em", transition: "opacity 0.15s",
      }}
        onMouseEnter={e => e.target.style.opacity = 0.85}
        onMouseLeave={e => e.target.style.opacity = 1}
      >
        Sell {isCC ? "Call" : "Put"} · {f$(opt.bid)} bid
      </button>
    </div>
  );
}

// ─── Chain Row (matches options-chain ChainRow exactly, with scanner overlays) ─
function ScannerRow({ result, selectedKey, onSelect }) {
  const { K, S, sym, side, type, maxCallOI, maxPutOI } = result;
  const key = `${sym}-${K}-${result.dte}-${type}`;
  const open = selectedKey === key;

  const isATM = Math.abs(K - S) < S * 0.005;
  const callITM = K < S;
  const putITM = K > S;
  const isCC = side === "call";

  // Which side is the scanner opportunity
  const accentColor = isCC ? "#00c805" : "#ff5000";
  const accentRGB = isCC ? "0,200,5" : "255,80,0";

  const callBg = callITM ? `rgba(0,200,5,${0.04 + Math.min(0.08, (result.call.oi / (maxCallOI || 1)) * 0.08)})` : "transparent";
  const putBg = putITM ? `rgba(255,80,0,${0.04 + Math.min(0.08, (result.put.oi / (maxPutOI || 1)) * 0.08)})` : "transparent";

  const activeSideBg = `rgba(${accentRGB},0.07)`;
  const callActiveBg = isCC && open ? activeSideBg : (isCC ? "rgba(0,200,5,0.04)" : callBg);
  const putActiveBg = !isCC && open ? activeSideBg : (!isCC ? "rgba(255,80,0,0.04)" : putBg);

  const cChg = result.call.change >= 0 ? "#00c805" : "#ff5000";
  const pChg = result.put.change >= 0 ? "#00c805" : "#ff5000";

  const cols = {
    vol: { flex: "0 0 44px", textAlign: "right" },
    chg: { flex: "0 0 52px", textAlign: "right" },
    iv: { flex: "0 0 44px", textAlign: "right" },
    bid: { flex: "0 0 52px", textAlign: "right" },
    ask: { flex: "0 0 52px", textAlign: "right" },
  };

  return (
    <>
      <div style={{
        display: "flex", alignItems: "stretch",
        borderBottom: `1px solid rgba(255,255,255,${isATM ? "0.12" : "0.04"})`,
        background: isATM ? "rgba(255,255,255,0.015)" : "transparent",
        position: "relative",
      }}>
        {/* ATM indicator */}
        {isATM && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 2, background: "rgba(255,255,255,0.3)", borderRadius: "0 1px 1px 0" }} />}

        {/* Scanner side accent top border */}
        <div style={{
          position: "absolute", left: isCC ? "0" : "50%", right: isCC ? "50%" : "0",
          top: 0, height: 2, borderRadius: "0 0 0 0",
          background: `rgba(${accentRGB},0.6)`,
        }} />

        {/* ── CALL SIDE ── */}
        <div
          onClick={() => isCC && onSelect(open ? null : key)}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end",
            padding: "10px 8px 6px",
            background: callActiveBg,
            cursor: isCC ? "pointer" : "default",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => { if (isCC) e.currentTarget.style.background = `rgba(0,200,5,0.09)`; }}
          onMouseLeave={e => { if (isCC) e.currentTarget.style.background = callActiveBg; }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, width: "100%" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end" }}>
              {isCC && <ScoreBadge score={result.metrics.score} />}
              <span style={{ ...cols.vol, fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono',monospace" }}>{fK(result.call.volume)}</span>
              <span style={{ ...cols.chg, fontSize: 11, color: cChg, fontFamily: "'DM Mono',monospace" }}>{result.call.change >= 0 ? "+" : ""}{f2(result.call.change)}</span>
              <span style={{ ...cols.iv, fontSize: 11, color: isCC ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.28)", fontFamily: "'DM Mono',monospace" }}>{fPct(result.ivRaw)}</span>
              <span style={{ ...cols.bid, fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "'DM Mono',monospace" }}>{f2(result.call.bid)}</span>
              <span style={{ ...cols.ask, fontSize: 13, fontWeight: 500, color: callITM || (isCC && open) ? "#fff" : "rgba(255,255,255,0.65)", fontFamily: "'DM Mono',monospace" }}>{f2(result.call.ask)}</span>
            </div>
            <OIBar value={result.call.oi} max={maxCallOI} color="rgba(0,200,5,0.5)" />
          </div>
        </div>

        {/* ── STRIKE + ANN YIELD ── */}
        <div style={{
          flex: "0 0 80px", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "6px 4px",
          borderLeft: "1px solid rgba(255,255,255,0.05)",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          background: isATM ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.2)",
        }}>
          <div style={{ fontSize: 13, fontWeight: isATM ? 600 : 400, fontFamily: "'DM Mono',monospace", color: isATM ? "#fff" : "rgba(255,255,255,0.7)", letterSpacing: "-0.02em" }}>
            {K}
          </div>
          <div style={{ fontSize: 10, color: accentColor, fontFamily: "'DM Mono',monospace", marginTop: 2, fontWeight: 600 }}>
            {fPct(result.metrics.annYield)}
          </div>
          {isATM && <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 1 }}>ATM</div>}
        </div>

        {/* ── PUT SIDE ── */}
        <div
          onClick={() => !isCC && onSelect(open ? null : key)}
          style={{
            flex: 1, display: "flex", alignItems: "center",
            padding: "10px 8px 6px",
            background: putActiveBg,
            cursor: !isCC ? "pointer" : "default",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => { if (!isCC) e.currentTarget.style.background = `rgba(255,80,0,0.09)`; }}
          onMouseLeave={e => { if (!isCC) e.currentTarget.style.background = putActiveBg; }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 3, width: "100%" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ ...cols.bid, fontSize: 13, fontWeight: 500, color: putITM || (!isCC && open) ? "#fff" : "rgba(255,255,255,0.65)", fontFamily: "'DM Mono',monospace" }}>{f2(result.put.bid)}</span>
              <span style={{ ...cols.ask, fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "'DM Mono',monospace" }}>{f2(result.put.ask)}</span>
              <span style={{ ...cols.iv, fontSize: 11, color: !isCC ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.28)", fontFamily: "'DM Mono',monospace" }}>{fPct(result.ivRaw)}</span>
              <span style={{ ...cols.chg, fontSize: 11, color: pChg, fontFamily: "'DM Mono',monospace" }}>{result.put.change >= 0 ? "+" : ""}{f2(result.put.change)}</span>
              <span style={{ ...cols.vol, fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono',monospace" }}>{fK(result.put.volume)}</span>
              {!isCC && <ScoreBadge score={result.metrics.score} />}
            </div>
            <OIBar value={result.put.oi} max={maxPutOI} color="rgba(255,80,0,0.5)" />
          </div>
        </div>
      </div>

      {/* ── Inline Detail ── */}
      {open && (
        <div style={{ padding: "8px", background: `rgba(${accentRGB},0.02)`, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <ContractDetail result={result} onClose={() => onSelect(null)} />
        </div>
      )}
    </>
  );
}

// ─── Symbol Group Header ──────────────────────────────────────────────────────
function SymbolHeader({ sym, results }) {
  const stock = WATCHLIST.find(s => s.sym === sym);
  const ccCount = results.filter(r => r.type === "CC").length;
  const cspCount = results.filter(r => r.type === "CSP").length;
  const bestScore = Math.max(...results.map(r => r.metrics.score));
  const bestAnn = Math.max(...results.map(r => r.metrics.annYield));
  const change = (Math.random() - 0.45) * stock.price * 0.02;
  const isUp = change >= 0;

  return (
    <div style={{
      padding: "14px 16px 10px",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.015)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: "linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.8)",
        }}>{sym.slice(0, 2)}</div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.02em" }}>{sym}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{stock.name}</span>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
            {ccCount > 0 && <span style={{ fontSize: 10, background: "rgba(0,200,5,0.1)", color: "#00c805", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>CC ×{ccCount}</span>}
            {cspCount > 0 && <span style={{ fontSize: 10, background: "rgba(255,80,0,0.1)", color: "#ff5000", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>CSP ×{cspCount}</span>}
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>HV {fPct(stock.hv)} · Best score <span style={{ color: "#fff", fontFamily: "'DM Mono',monospace" }}>{bestScore}</span></span>
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 18, fontWeight: 300, fontFamily: "'DM Mono',monospace", letterSpacing: "-0.03em" }}>
          {f$(stock.price)}
        </div>
        <div style={{ fontSize: 11, color: isUp ? "#00c805" : "#ff5000", fontFamily: "'DM Mono',monospace" }}>
          {isUp ? "+" : ""}{f2(change)} · Best ann. <span style={{ fontWeight: 600 }}>{fPct(bestAnn)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: "Steady Income", icon: Target, f: { strategy: "both", minROI: 10, minDTE: 21, maxDTE: 45, minDelta: 0.15, maxDelta: 0.28, minVol: 20, minPrice: 1000 } },
  { label: "Aggressive", icon: Zap, f: { strategy: "both", minROI: 40, minDTE: 7, maxDTE: 21, minDelta: 0.25, maxDelta: 0.45, minVol: 10, minPrice: 1000 } },
  { label: "IV Rich Only", icon: Flame, f: { strategy: "both", minROI: 15, minDTE: 14, maxDTE: 45, minDelta: 0.15, maxDelta: 0.40, minVol: 10, minPrice: 1000 } },
  { label: "Monthly Wheel", icon: CalendarRange, f: { strategy: "both", minROI: 12, minDTE: 28, maxDTE: 60, minDelta: 0.15, maxDelta: 0.30, minVol: 30, minPrice: 1000 } },
];

export default function OptionsScanner({ ticker = '', currentPrice = null }) {
  const [filters, setFilters] = useState({ strategy: "both", minROI: 5, minDTE: 7, maxDTE: 45, minDelta: 0.10, maxDelta: 0.50, minVol: 1, minPrice: 1000 });
  const [results, setResults] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [groupBy, setGroupBy] = useState(true);
  const [optionData, setOptionData] = useState(null);
  const scanRef = useRef(null);
  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  // Fetch real option data when ticker changes
  useEffect(() => {
    if (!ticker) return;
    
    let cancelled = false;
    
    const fetchOptions = async () => {
      try {
        // Always fetch fresh - use currentPrice from parent or fetch quote
        let price = currentPrice;
        if (!price) {
          const quoteRes = await fetch(`/api/quote?symbol=${ticker}&_t=${Date.now()}`);
          const quote = await quoteRes.json();
          price = quote.regularMarketPrice;
        }
        
        if (cancelled) return;
        
        const res = await fetch(`/api/options?symbol=${ticker}&_t=${Date.now()}`);
        const data = await res.json();
        
        if (cancelled) return;
        
        if (data?.options?.length) {
          setOptionData({ ticker, currentPrice: price, options: data.options });
        }
      } catch (e) {
        console.error('[Scanner] Failed to fetch options:', e);
      }
    };
    fetchOptions();
    
    return () => { cancelled = true; };
  }, [ticker, currentPrice]);

  const scan = useCallback((overrides = {}) => {
    setScanning(true); setSelectedKey(null);
    if (scanRef.current) clearTimeout(scanRef.current);
    scanRef.current = setTimeout(() => {
      try {
        let scanResults = [];
        if (optionData && optionData.ticker === ticker && ticker) {
          scanResults = runScannerWithRealData({ ...filters, ...overrides }, optionData);
        } else {
          scanResults = runScanner({ ...filters, ...overrides });
        }
        setResults(scanResults);
      } catch (e) {
        console.error('Scan error:', e);
        setResults([]);
      }
      setScanning(false); setHasRun(true);
    }, 500);
  }, [filters, optionData, ticker]);

  // Run initial scan - removed for now to debug
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     scan();
  //   }, 100);
  //   return () => clearTimeout(timer);
  // }, []);

  const bySymbol = useMemo(() => {
    const m = {};
    for (const r of results) {
      if (!m[r.sym]) m[r.sym] = [];
      m[r.sym].push(r);
    }
    return m;
  }, [results]);

  const syms = Object.keys(bySymbol);
  const ccTotal = results.filter(r => r.type === "CC").length;
  const cspTotal = results.filter(r => r.type === "CSP").length;
  const topAnn = results.length ? Math.max(...results.map(r => r.metrics.annYield)) : 0;
  const ivRich = results.filter(r => r.metrics.ivEdge > 0.15).length;

  const ColHeaders = () => (
    <div style={{
      display: "flex", alignItems: "center", padding: "9px 8px",
      background: "rgba(0,0,0,0.7)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      position: "sticky", top: 0, zIndex: 20, backdropFilter: "blur(16px)",
    }}>
      {/* Call side */}
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", gap: 6, paddingRight: 4 }}>
        {["Score", "Volume", "Change", "IV", "Bid", "Ask"].map(h => (
          <span key={h} style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.07em", flex: "0 0 " + (h === "Score" ? "36px" : "52px"), textAlign: "right", fontFamily: "'DM Mono',monospace" }}>{h}</span>
        ))}
      </div>
      <div style={{ flex: "0 0 80px", textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'DM Mono',monospace" }}>Strike<br /><span style={{ fontSize: 9, opacity: 0.6 }}>Ann Ret</span></div>
      {/* Put side */}
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-start", gap: 6, paddingLeft: 4 }}>
        {["Bid", "Ask", "IV", "Change", "Volume", "Score"].map(h => (
          <span key={h} style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.07em", flex: "0 0 " + (h === "Score" ? "36px" : "52px"), textAlign: "left", fontFamily: "'DM Mono',monospace" }}>{h}</span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="opt-scanner-container" style={{ background: "transparent", color: "#fff", fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@300;400;500&display=swap');
        
        .opt-scanner-container ::-webkit-scrollbar{width:4px;height:4px;}
        .opt-scanner-container ::-webkit-scrollbar-track{background:transparent;}
        .opt-scanner-container ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px;}
        
        @keyframes slideDown{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:translateY(0);}}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}

        .mode-btn{flex:1;background:transparent;border:none;color:rgba(255,255,255,0.4);font-family:inherit;font-size:13px;font-weight:500;padding:8px 0;cursor:pointer;border-radius:8px;transition:all 0.15s;}
        .mode-btn.active{background:rgba(255,255,255,0.1);color:#fff;}

        .exp-chip{flex-shrink:0;background:transparent;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);border-radius:20px;padding:5px 12px;font-size:12px;font-family:inherit;cursor:pointer;transition:all 0.15s;white-space:nowrap;}
        .exp-chip.active{background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.25);}
        .exp-chip:hover{border-color:rgba(255,255,255,0.25);color:rgba(255,255,255,0.8);}

        .filter-btn{background:transparent;border:none;color:rgba(255,255,255,0.35);font-family:inherit;font-size:12px;padding:4px 10px;cursor:pointer;border-radius:12px;transition:all 0.12s;}
        .filter-btn.active{background:rgba(255,255,255,0.08);color:#fff;}

        .preset-btn{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);border-radius:20px;padding:6px 14px;font-size:12px;font-family:inherit;cursor:pointer;transition:all 0.13s;white-space:nowrap;}
        .preset-btn:hover{background:rgba(255,255,255,0.08);color:#fff;border-color:rgba(255,255,255,0.2);}

        .scan-btn{padding:9px 20px;background:linear-gradient(135deg,#00c805,#009a04);border:none;border-radius:20px;color:#000;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.15s;box-shadow:0 0 16px rgba(0,200,5,0.25);}
        .scan-btn:hover{box-shadow:0 0 24px rgba(0,200,5,0.4);transform:translateY(-1px);}
        .scan-btn:disabled{background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.3);box-shadow:none;transform:none;cursor:not-allowed;}

        .opt-scanner-container input[type=range]{width:100%;accent-color:#00c805;height:3px;cursor:pointer;}
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 60 }}>

        {/* ── Scanner Header ── */}
        <div style={{ padding: "24px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: "linear-gradient(135deg,#00c805,#007a03)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, color: "#000", fontWeight: 800,
              }}>⌬</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em" }}>Option Scanner</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Covered Calls & Cash-Secured Puts · {WATCHLIST.length} symbols</div>
              </div>
            </div>
            {hasRun && !scanning && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 300, fontFamily: "'DM Mono',monospace", letterSpacing: "-0.03em", color: "#00c805" }}>{results.length}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>opportunities</div>
              </div>
            )}
            {scanning && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#00c805" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00c805", animation: "pulse 1s infinite" }} />
                Scanning…
              </div>
            )}
          </div>

          {/* Summary stats (post-scan) */}
          {hasRun && !scanning && (
            <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
              {[
                { label: "Covered Calls", val: ccTotal, extra: "opportunities" },
                { label: "Cash-Sec Puts", val: cspTotal, extra: "opportunities" },
                { label: "IV-Rich Plays", val: ivRich, extra: "IV > HV +15%" },
                { label: "Best Ann. Return", val: fPct(topAnn), extra: "top pick" },
              ].map(({ label, val, extra }) => (
                <div key={label}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, fontFamily: "'DM Mono',monospace", fontWeight: 500 }}>
                    {val}
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: 5 }}>{extra}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Strategy + Presets ── */}
        <div style={{ padding: "14px 16px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Strategy</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 3, gap: 2, marginRight: 4 }}>
              {[["cc", "Calls"], ["both", "Both"], ["csp", "Puts"]].map(([val, label]) => (
                <button key={val} className={`mode-btn${filters.strategy === val ? " active" : ""}`} style={{ minWidth: 60 }} onClick={() => set("strategy", val)}>{label}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
              {PRESETS.map(p => {
                const Icon = p.icon;
                return (
                  <button key={p.label} className="preset-btn" style={{ display: "flex", alignItems: "center", gap: 6 }} onClick={() => { setFilters(f => ({ ...f, ...p.f })); setTimeout(() => scan(p.f), 50); }}>
                    <Icon size={12} color="rgba(255,255,255,0.7)" />
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── DTE + Delta + ROI Controls ── */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", gap: 0, alignItems: "center", flexWrap: "wrap", rowGap: 14 }}>

            {/* DTE */}
            <div style={{ flex: "0 0 auto", marginRight: 20 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Expiration</div>
              <div style={{ display: "flex", gap: 5 }}>
                {[[7, "7d"], [14, "14d"], [21, "21d"], [30, "30d"], [45, "45d"], [60, "60d"]].map(([d, label]) => {
                  const active = filters.minDTE <= d && filters.maxDTE >= d;
                  return (
                    <button key={d}
                      className={`exp-chip${active ? " active" : ""}`}
                      onClick={() => { set("minDTE", Math.min(d, filters.minDTE)); set("maxDTE", Math.max(d, filters.maxDTE)); }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Delta */}
            <div style={{ flex: "0 0 auto", marginRight: 20 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Delta Range</div>
              <div style={{ display: "flex", gap: 4 }}>
                {[["0.10–0.20", 0.10, 0.20, "Deep OTM"], ["0.20–0.35", 0.20, 0.35, "Sweet spot"], ["0.30–0.45", 0.30, 0.45, "Aggressive"]].map(([label, mn, mx, sub]) => {
                  const active = filters.minDelta === mn && filters.maxDelta === mx;
                  return (
                    <button key={label}
                      className={`filter-btn${active ? " active" : ""}`}
                      onClick={() => { set("minDelta", mn); set("maxDelta", mx); }}
                      title={sub}
                    >{label}</button>
                  );
                })}
              </div>
            </div>

            {/* Min ROI */}
            <div style={{ flex: "0 0 auto" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Min Annual ROI: <span style={{ color: "#fff", fontFamily: "'DM Mono',monospace" }}>{filters.minROI}%</span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[5, 10, 15, 25, 40, 60].map(v => (
                  <button key={v} className={`filter-btn${filters.minROI === v ? " active" : ""}`} onClick={() => set("minROI", v)}>{v}%</button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div style={{ flex: "0 0 auto" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Stock Price Under: <span style={{ color: "#fff", fontFamily: "'DM Mono',monospace" }}>${filters.minPrice}</span>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {[20, 50, 100, 200, 500, 1000].map(v => (
                  <button key={v} className={`filter-btn${filters.minPrice === v ? " active" : ""}`} onClick={() => set("minPrice", v)}>${v}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Controls Bar (mode + filter + scan) ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", gap: 4 }}>
            <button className={`filter-btn${groupBy ? " active" : ""}`} onClick={() => setGroupBy(true)}>By Symbol</button>
            <button className={`filter-btn${!groupBy ? " active" : ""}`} onClick={() => setGroupBy(false)}>By Score</button>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono',monospace" }}>
              Δ {filters.minDelta.toFixed(2)}–{filters.maxDelta.toFixed(2)} · {filters.minDTE}–{filters.maxDTE}d · ≥{filters.minROI}% ROI · ≥${filters.minPrice}
            </span>
            <button className="scan-btn" onClick={() => scan()} disabled={scanning}>
              {scanning ? (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 12, height: 12, border: "2px solid rgba(0,0,0,0.3)", borderTop: "2px solid #000", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                  Scanning
                </span>
              ) : "Scan"}
            </button>
          </div>
        </div>

        {/* ── Column Headers ── */}
        <ColHeaders />

        {/* ── Results ── */}
        {scanning ? (
          <div style={{ padding: "60px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, color: "rgba(255,255,255,0.3)" }}>
            <div style={{ width: 40, height: 40, border: "3px solid rgba(0,200,5,0.15)", borderTop: "3px solid #00c805", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Scanning {WATCHLIST.length} symbols across all expirations…</div>
          </div>
        ) : !hasRun ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: "rgba(255,255,255,0.25)" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⌬</div>
            <div>Hit Scan to find opportunities</div>
          </div>
        ) : results.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "rgba(255,255,255,0.25)" }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>No results — try loosening your filters</div>
          </div>
        ) : groupBy ? (
          syms.map(sym => (
            <div key={sym}>
              <SymbolHeader sym={sym} results={bySymbol[sym]} />
              {bySymbol[sym].map((r, i) => (
                <ScannerRow
                  key={`${r.sym}-${r.K}-${r.dte}-${r.type}`}
                  result={r}
                  selectedKey={selectedKey}
                  onSelect={setSelectedKey}
                />
              ))}
            </div>
          ))
        ) : (
          results.map((r, i) => (
            <div key={`${r.sym}-${r.K}-${r.dte}-${r.type}`}>
              {(i === 0 || results[i - 1].sym !== r.sym) && (
                <div style={{ padding: "8px 16px 4px", fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono',monospace", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  {r.sym} · {r.name} · ${r.S.toFixed(2)}
                </div>
              )}
              <ScannerRow result={r} selectedKey={selectedKey} onSelect={setSelectedKey} />
            </div>
          ))
        )}

        {hasRun && !scanning && results.length > 0 && (
          <div style={{ padding: "20px 16px", fontSize: 11, color: "rgba(255,255,255,0.2)", lineHeight: 1.7 }}>
            {results.length} results across {syms.length} symbols · Priced via Black-Scholes with volatility smile ·
            Score = annualized yield + IV/HV edge + delta + liquidity · Not financial advice.
          </div>
        )}
      </div>
    </div>
  );
}
