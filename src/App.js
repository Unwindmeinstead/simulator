import { useState, useEffect } from "react";

/* ─── helpers ─── */
const fmt = (n, d = 2) => (typeof n === "number" ? n.toFixed(d) : "—");
const fmtDollar = (n) => (typeof n === "number" ? "$" + fmt(n) : "—");
const fmtK = (n) => {
  if (typeof n !== "number") return "—";
  if (Math.abs(n) >= 1000) return "$" + (n / 1000).toFixed(2) + "k";
  return "$" + fmt(n);
};


function calcCoveredCall({ stockPrice, strikePrice, targetRoi, budget }) {
  const sp = parseFloat(stockPrice);
  const strike = parseFloat(strikePrice);
  const roi = parseFloat(targetRoi) / 100;
  const bud = parseFloat(budget);
  if ([sp, strike, roi].some((v) => isNaN(v) || v <= 0)) return null;


  const premiumPerShare = roi * sp;
  const denom = sp - premiumPerShare;
  const roiIfAssigned =
    denom !== 0 ? ((premiumPerShare + (strike - sp)) / denom) * 100 : null;


  // budget branch
  let budgetResult = null;
  if (!isNaN(bud) && bud > 0) {
    const sharesAffordable = Math.floor(bud / sp);
    const contracts = Math.floor(sharesAffordable / 100);
    const sharesUsed = contracts * 100;
    const actualCost = sharesUsed * sp;
    const cashLeftover = bud - actualCost;
    const premiumTotal = sharesUsed * premiumPerShare;
    const premiumPerContract = premiumPerShare * 100;
    const effectiveCostBasis = sp - premiumPerShare;
    budgetResult = {
      sharesAffordable,
      contracts,
      sharesUsed,
      actualCost,
      cashLeftover,
      premiumTotal,
      premiumPerContract,
      effectiveCostBasis,
    };
  }


  const breakeven = sp - premiumPerShare;
  const maxProfit = premiumPerShare + (strike - sp);
  const protectionPct = (premiumPerShare / sp) * 100;
  const otmPct = ((strike - sp) / sp) * 100;


  return {
    premiumPerShare,
    roiIfAssigned,
    breakeven,
    maxProfit,
    protectionPct,
    otmPct,
    budgetResult,
  };
}


function calcCashSecuredPut({ stockPrice, strikePrice, targetRoi, budget }) {
  const sp = parseFloat(stockPrice);
  const strike = parseFloat(strikePrice);
  const roi = parseFloat(targetRoi) / 100;
  const bud = parseFloat(budget);
  if ([sp, strike, roi].some((v) => isNaN(v) || v <= 0)) return null;


  // cash required per contract = strike * 100
  const cashPerContract = strike * 100;
  const premiumPerShare = roi * strike; // ROI on cash secured
  const premiumPerContract = premiumPerShare * 100;


  const breakeven = strike - premiumPerShare;
  const roiAnnualized = roi * 100; // simple, not annualized
  const otmPct = ((sp - strike) / sp) * 100; // positive = OTM put


  const denom = strike - premiumPerShare;
  const roiIfAssigned =
    denom !== 0 ? ((premiumPerShare - (strike - sp)) / denom) * 100 : null;


  // budget
  let budgetResult = null;
  if (!isNaN(bud) && bud > 0) {
    const contracts = Math.floor(bud / cashPerContract);
    const cashUsed = contracts * cashPerContract;
    const cashLeftover = bud - cashUsed;
    const premiumTotal = contracts * premiumPerContract;
    const sharesIfAssigned = contracts * 100;
    const costIfAssigned = strike * sharesIfAssigned;
    budgetResult = {
      contracts,
      cashUsed,
      cashLeftover,
      premiumTotal,
      premiumPerContract,
      sharesIfAssigned,
      costIfAssigned,
      effectiveCostBasis: breakeven,
    };
  }


  return {
    premiumPerShare,
    premiumPerContract,
    cashPerContract,
    breakeven,
    roiIfAssigned,
    roiAnnualized,
    otmPct,
    budgetResult,
  };
}


/* ─── payoff chart ─── */
function PayoffChart({ stockPrice, strikePrice, premium, type }) {
  const sp = parseFloat(stockPrice);
  const strike = parseFloat(strikePrice);
  if (isNaN(sp) || isNaN(strike) || isNaN(premium)) return null;


  const W = 680, H = 160;
  const pad = { l: 52, r: 16, t: 18, b: 28 };
  const range = sp * 0.55;
  const minX = sp - range;
  const maxX = sp + range;


  const payoff = (s) => {
    if (type === "cc") {
      return premium + (s - sp) - Math.max(0, s - strike);
    } else {
      // cash secured put: sold put
      return premium - Math.max(0, strike - s);
    }
  };


  const vals = Array.from({ length: 100 }, (_, i) => payoff(minX + (i / 99) * (maxX - minX)));
  const minV = Math.min(...vals) * 1.15;
  const maxV = Math.max(...vals) * 1.15;


  const toX = (s) => pad.l + ((s - minX) / (maxX - minX)) * (W - pad.l - pad.r);
  const toY = (v) => pad.t + (1 - (v - minV) / (maxV - minV)) * (H - pad.t - pad.b);


  const pts = Array.from({ length: 100 }, (_, i) => {
    const s = minX + (i / 99) * (maxX - minX);
    return [toX(s), toY(payoff(s))];
  });
  const path = "M " + pts.map(([x, y]) => `${x},${y}`).join(" L ");


  const zeroY = toY(0);
  const breakeven = type === "cc" ? sp - premium : strike - premium;
  const breakevenX = toX(Math.max(minX, Math.min(maxX, breakeven)));
  const strikeX = toX(Math.max(minX, Math.min(maxX, strike)));
  const currX = toX(sp);


  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <clipPath id={`above-${type}`}>
          <rect x={pad.l} y={pad.t} width={W - pad.l - pad.r} height={Math.max(0, zeroY - pad.t)} />
        </clipPath>
        <clipPath id={`below-${type}`}>
          <rect x={pad.l} y={zeroY} width={W - pad.l - pad.r} height={Math.max(0, H - pad.b - zeroY)} />
        </clipPath>
      </defs>
      <line x1={pad.l} y1={zeroY} x2={W - pad.r} y2={zeroY} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
      <path d={path} fill="none" stroke="rgba(0,255,136,0.7)" strokeWidth={2.5} clipPath={`url(#above-${type})`} />
      <path d={path} fill="none" stroke="rgba(255,80,80,0.7)" strokeWidth={2.5} clipPath={`url(#below-${type})`} />


      {[
        { x: strikeX, label: `K $${strike}`, color: "rgba(255,200,0,0.55)" },
        { x: currX, label: `S $${sp}`, color: "rgba(255,255,255,0.3)" },
        { x: breakevenX, label: `B/E $${breakeven.toFixed(2)}`, color: "rgba(0,255,136,0.5)" },
      ].map(({ x, label, color }, i) => (
        <g key={i}>
          <line x1={x} y1={pad.t} x2={x} y2={H - pad.b} stroke={color} strokeWidth={1} strokeDasharray="3,3" />
          <text x={x} y={H - pad.b + 13} textAnchor="middle" fill={color} fontSize={9} fontFamily="'IBM Plex Mono',monospace">{label}</text>
        </g>
      ))}


      {[maxV * 0.85, 0, minV * 0.85].map((v) => (
        <text key={v} x={pad.l - 5} y={toY(v) + 4} textAnchor="end" fill="rgba(255,255,255,0.22)" fontSize={9} fontFamily="'IBM Plex Mono',monospace">
          {v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2)}
        </text>
      ))}
    </svg>
  );
}

/* ─── sub-components ─── */
const Label = ({ children }) => (
  <span style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", fontFamily: "'IBM Plex Mono',monospace" }}>
    {children}
  </span>
);


const Input = ({ label, value, onChange, prefix, suffix, step = "0.01", placeholder }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
    <Label>{label}</Label>
    <div style={{ position: "relative" }}>
      {prefix && <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.28)", fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, pointerEvents: "none" }}>{prefix}</span>}
      <input
        type="number"
        value={value}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 8, padding: `11px ${suffix ? "36px" : "12px"} 11px ${prefix ? "26px" : "12px"}`, color: "#fff", fontFamily: "'IBM Plex Mono',monospace", fontSize: 14, outline: "none", boxSizing: "border-box", transition: "border-color 0.18s" }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(0,255,136,0.38)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.09)")}
      />
      {suffix && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "rgba(255,255,255,0.28)", fontFamily: "'IBM Plex Mono',monospace" }}>{suffix}</span>}
    </div>
  </div>
);

const Card = ({ children, accent, warn, style: sx }) => (
  <div style={{ background: accent ? 'rgba(0,255,136,0.08)' : warn ? 'rgba(255,165,0,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${accent ? 'rgba(0,255,136,0.28)' : warn ? 'rgba(255,165,0,0.18)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: '12px 14px', ...sx }}>
    {children}
  </div>
);

function CoveredCallPanel() {
  const [f, setF] = useState({ stockPrice: '10', strikePrice: '12', targetRoi: '25', budget: '' });
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const r = calcCoveredCall(f);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 22 }}>
      <div style={{ background: '#0b0f15', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Position</div>
        <div style={{ display: 'grid', gap: 10 }}>
          <Input label="Stock Price" value={f.stockPrice} onChange={set('stockPrice')} prefix="$" />
          <Input label="Strike Price" value={f.strikePrice} onChange={set('strikePrice')} prefix="$" />
          <Input label="Target ROI" value={f.targetRoi} onChange={set('targetRoi')} suffix="%" step="0.5" />
          <Input label="Total Budget" value={f.budget} onChange={set('budget')} prefix="$" placeholder="optional" />
          {r && (
            <div style={{ background: r.otmPct >= 0 ? 'rgba(0,255,136,0.06)' : 'rgba(255,80,80,0.06)', border: `1px solid ${r.otmPct >= 0 ? 'rgba(0,255,136,0.18)' : 'rgba(255,80,80,0.18)'}`, borderRadius: 9, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>OTM</span>
              <span style={{ color: r.otmPct >= 0 ? '#00ff88' : '#ff6060' }}>{r.otmPct >= 0 ? '+' : ''}{r.otmPct.toFixed(2)}%</span>
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {r ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Card accent>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Premium / Share</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>${f.premium || '0.00'}</div>
              </Card>
              <Card>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Breakeven</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>${r.breakeven.toFixed(2)}</div>
              </Card>
              <Card>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>ROI if Assigned</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{r.roiIfAssigned ? r.roiIfAssigned.toFixed(2) : 0}%</div>
              </Card>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Card>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Max Profit</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>${r.maxProfit.toFixed(2)}</div>
              </Card>
              <Card>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Payoff</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>Per Share</div>
              </Card>
            </div>
            <div>
              <PayoffChart stockPrice={f.stockPrice} strikePrice={f.strikePrice} premium={f.premium} type="cc" />
            </div>
          </>
        ) : (
          <div style={{ padding: 20 }}>Enter inputs to compute</div>
        )}
      </div>
    </div>
  );
}

function PayoffChart({ stockPrice, strikePrice, premium, type }) {
  // tiny placeholder chart for launching
  return (
    <svg width="100%" height={120} viewBox="0 0 320 120" style={{ display: 'block' }}>
      <rect width="100%" height="100%" fill="#0b0f15" />
      <text x="50%" y="50%" fill="#9bd" textAnchor="middle" fontFamily="monospace">PayoffChart</text>
    </svg>
  );
}

function CSPPanel() {
  const [f, setF] = useState({ stockPrice: '100', strikePrice: '95', premium: '1.80', dte: '30', budget: '' });
  const set = k => v => setF(p => ({...p, [k]: v}));
  const r = null; // placeholder for compatibility
  return (
    <div style={{ padding: 16 }}>CSP Panel placeholder (logic from user code is in App.js)</div>
  );
}

export default App;
