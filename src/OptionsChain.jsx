import { useState, useMemo, useCallback, useRef, useEffect } from "react";

// ─── Black-Scholes Engine ────────────────────────────────────────────────────
function erf(x) {
  const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
  const sign = x < 0 ? -1 : 1; x = Math.abs(x);
  const t = 1/(1+p*x);
  const y = 1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
  return sign*y;
}
const cdf = x => (1+erf(x/Math.sqrt(2)))/2;
const pdf = x => Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI);


function bs(S, K, T, r, sigma, type) {
  if (T <= 0) {
    const intrinsic = type === "call" ? Math.max(0, S-K) : Math.max(0, K-S);
    return { price: intrinsic, delta: type==="call"?(S>K?1:0):(S<K?-1:0), gamma:0, theta:0, vega:0, iv: sigma };
  }
  const d1 = (Math.log(S/K) + (r + sigma*sigma/2)*T) / (sigma*Math.sqrt(T));
  const d2 = d1 - sigma*Math.sqrt(T);
  const price = type === "call"
    ? S*cdf(d1) - K*Math.exp(-r*T)*cdf(d2)
    : K*Math.exp(-r*T)*cdf(-d2) - S*cdf(-d1);
  const delta = type === "call" ? cdf(d1) : cdf(d1)-1;
  const gamma = pdf(d1)/(S*sigma*Math.sqrt(T));
  const theta = type === "call"
    ? (-S*pdf(d1)*sigma/(2*Math.sqrt(T)) - r*K*Math.exp(-r*T)*cdf(d2))/365
    : (-S*pdf(d1)*sigma/(2*Math.sqrt(T)) + r*K*Math.exp(-r*T)*cdf(-d2))/365;
  const vega = S*pdf(d1)*Math.sqrt(T)/100;
  return { price: Math.max(0.01, price), delta, gamma, theta, vega, iv: sigma };
}


// ─── Formatters ──────────────────────────────────────────────────────────────
const fmt2 = n => n?.toFixed(2) ?? "—";
const fmt3 = n => n?.toFixed(3) ?? "—";
const fmtK = n => n >= 1000 ? (n/1000).toFixed(1)+"K" : n?.toString() ?? "—";
const fmtPct = n => (n*100).toFixed(1)+"%";


// ─── OI Bar ──────────────────────────────────────────────────────────────────
function OIBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(1, value/max) * 100 : 0;
  return (
    <div style={{ width:"100%", height:3, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden" }}>
      <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:2, transition:"width 0.4s ease" }} />
    </div>
  );
}


// ─── Greeks Row ──────────────────────────────────────────────────────────────
function GreekPill({ label, value, color }) {
  return (
    <div style={{ textAlign:"center", flex:1 }}>
      <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:14, fontFamily:"'DM Mono',monospace", fontWeight:400, color: color||"#fff" }}>{value}</div>
    </div>
  );
}


// ─── Contract Detail Panel ───────────────────────────────────────────────────
function ContractDetail({ row, type, expLabel, onClose, stockPrice, ticker }) {
  const opt = row[type];
  const breakeven = type==="call" ? row.strike+opt.ask : row.strike-opt.ask;
  const maxProfit = type==="call" ? "Unlimited" : `$${((row.strike - opt.ask)*100).toFixed(0)}`;
  const maxLoss = `$${(opt.ask*100).toFixed(0)}`;
  const color = type==="call" ? "#00c805" : "#ff5000";
  const changeColor = opt.change >= 0 ? "#00c805" : "#ff5000";


  return (
    <div style={{
      background:"#111",
      border:"1px solid rgba(255,255,255,0.08)",
      borderRadius:16,
      padding:"20px",
      marginTop:2,
      animation:"slideDown 0.2s ease",
    }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <span style={{
              fontSize:11, fontWeight:600,
              background: type==="call" ? "rgba(0,200,5,0.12)" : "rgba(255,80,0,0.12)",
              color, padding:"3px 10px", borderRadius:12, letterSpacing:"0.04em",
            }}>
              {type.toUpperCase()}
            </span>
            <span style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>{ticker} ${row.strike} · {expLabel}</span>
          </div>
          <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
            <span style={{ fontSize:28, fontWeight:300, fontFamily:"'DM Mono',monospace", letterSpacing:"-0.03em" }}>
              ${fmt2(opt.ask)}
            </span>
            <span style={{ fontSize:13, color:changeColor, fontFamily:"'DM Mono',monospace" }}>
              {opt.change>=0?"+":""}{fmt2(opt.change)} ({opt.change>=0?"+":""}{((opt.change/opt.mid)*100).toFixed(1)}%)
            </span>
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2, fontFamily:"'DM Mono',monospace" }}>
            Per contract: ${(opt.ask*100).toFixed(2)}
          </div>
        </div>
        <button onClick={onClose} style={{
          background:"rgba(255,255,255,0.07)", border:"none", color:"rgba(255,255,255,0.5)",
          borderRadius:8, width:28, height:28, cursor:"pointer", fontSize:16,
          display:"flex", alignItems:"center", justifyContent:"center"
        }}>×</button>
      </div>

      {/* Key stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
        {[
          { label:"Breakeven", val:`$${fmt2(breakeven)}`, sub: `${(((breakeven-stockPrice)/stockPrice)*100).toFixed(1)}% away` },
          { label:"Max Profit", val:maxProfit, sub:"at expiration" },
          { label:"Max Loss",   val:maxLoss,   sub:"premium paid" },
        ].map(({label,val,sub}) => (
          <div key={label} style={{ background:"rgba(255,255,255,0.04)", borderRadius:10, padding:"12px 10px" }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:5 }}>{label}</div>
            <div style={{ fontSize:14, fontWeight:500, fontFamily:"'DM Mono',monospace" }}>{val}</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Greeks */}
      <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:10, padding:"14px 10px", marginBottom:16 }}>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:12, textAlign:"center" }}>Greeks</div>
        <div style={{ display:"flex", gap:4 }}>
          <GreekPill label="Δ Delta" value={fmt3(opt.delta)} color={opt.delta>0?"#00c805":"#ff5000"} />
          <GreekPill label="Γ Gamma" value={fmt3(opt.gamma)} />
          <GreekPill label="Θ Theta" value={fmt3(opt.theta)} color="#ff5000" />
          <GreekPill label="V Vega"  value={fmt3(opt.vega)} color="#60a5fa" />
          <GreekPill label="IV" value={fmtPct(opt.iv)} />
        </div>
      </div>

      {/* Bid/Ask/Volume/OI */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:1 }}>
        {[
          { label:"Bid",    val:`$${fmt2(opt.bid)}` },
          { label:"Ask",    val:`$${fmt2(opt.ask)}` },
          { label:"Volume", val:fmtK(opt.volume) },
          { label:"Open Int", val:fmtK(opt.oi) },
        ].map(({label,val}) => (
          <div key={label} style={{ textAlign:"center", padding:"10px 4px" }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.28)", textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>{label}</div>
            <div style={{ fontSize:13, fontFamily:"'DM Mono',monospace" }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Buy button */}
      <button style={{
        width:"100%", marginTop:16, padding:"14px",
        background: color, border:"none", borderRadius:12,
        color:"#000", fontSize:15, fontWeight:700, cursor:"pointer",
        fontFamily:"inherit", letterSpacing:"-0.01em",
        transition:"opacity 0.15s",
      }}
        onMouseEnter={e => e.target.style.opacity=0.85}
        onMouseLeave={e => e.target.style.opacity=1}
      >
        Buy {type==="call"?"Call":"Put"} · ${fmt2(opt.ask)} / contract
      </button>
    </div>
  );
}


// ─── Row ─────────────────────────────────────────────────────────────────────
function ChainRow({ row, maxCallOI, maxPutOI, mode, selected, onSelect, expLabel, stockPrice, ticker }) {
  const isATM = Math.abs(row.strike - stockPrice) < 2.5;
  const callITM = row.strike < stockPrice;
  const putITM  = row.strike > stockPrice;

  const callBg = callITM
    ? `rgba(0,200,5,${0.04 + Math.min(0.08, (row.call.oi/maxCallOI)*0.08)})`
    : "transparent";
  const putBg = putITM
    ? `rgba(255,80,0,${0.04 + Math.min(0.08, (row.put.oi/maxPutOI)*0.08)})`
    : "transparent";

  const showCallDetail = selected?.strike===row.strike && selected?.type==="call";
  const showPutDetail  = selected?.strike===row.strike && selected?.type==="put";

  const callChangeColor = row.call.change>=0 ? "#00c805" : "#ff5000";
  const putChangeColor  = row.put.change>=0  ? "#00c805" : "#ff5000";

  const cols = {
    bid:   { flex:"0 0 52px", textAlign:"right" },
    ask:   { flex:"0 0 52px", textAlign:"right" },
    iv:    { flex:"0 0 44px", textAlign:"right" },
    chg:   { flex:"0 0 52px", textAlign:"right" },
    vol:   { flex:"0 0 44px", textAlign:"right" },
    strike:{ flex:"0 0 64px", textAlign:"center" },
  };

  return (
    <>
      <div style={{
        display:"flex",
        alignItems:"stretch",
        borderBottom:`1px solid rgba(255,255,255,${isATM?"0.12":"0.04"})`,
        background: isATM ? "rgba(255,255,255,0.02)" : "transparent",
        position:"relative",
        transition:"background 0.15s",
      }}>
        {/* ATM indicator */}
        {isATM && (
          <div style={{
            position:"absolute", left:0, top:0, bottom:0, width:2,
            background:"rgba(255,255,255,0.3)", borderRadius:"0 1px 1px 0",
          }} />
        )}

        {/* ── CALL SIDE ── */}
        {(mode==="both"||mode==="calls") && (
          <div
            onClick={() => onSelect(row, "call")}
            style={{
              flex:1, display:"flex", alignItems:"center", justifyContent:"flex-end",
              padding:"10px 8px 6px",
              background: showCallDetail ? "rgba(0,200,5,0.06)" : callBg,
              cursor:"pointer",
              transition:"background 0.15s",
              gap:0,
            }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(0,200,5,0.08)"}
            onMouseLeave={e=>e.currentTarget.style.background=showCallDetail?"rgba(0,200,5,0.06)":callBg}
          >
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:3, width:"100%" }}>
              <div style={{ display:"flex", gap:6, alignItems:"center", justifyContent:"flex-end" }}>
                <span style={{ ...cols.vol, fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"'DM Mono',monospace" }}>{fmtK(row.call.volume)}</span>
                <span style={{ ...cols.chg, fontSize:11, color:callChangeColor, fontFamily:"'DM Mono',monospace" }}>{row.call.change>=0?"+":""}{fmt2(row.call.change)}</span>
                <span style={{ ...cols.iv, fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:"'DM Mono',monospace" }}>{fmtPct(row.call.iv)}</span>
                <span style={{ ...cols.bid, fontSize:12, color:"rgba(255,255,255,0.5)", fontFamily:"'DM Mono',monospace" }}>{fmt2(row.call.bid)}</span>
                <span style={{ ...cols.ask, fontSize:13, fontWeight:500, color:callITM?"#fff":"rgba(255,255,255,0.65)", fontFamily:"'DM Mono',monospace" }}>{fmt2(row.call.ask)}</span>
              </div>
              <OIBar value={row.call.oi} max={maxCallOI} color="rgba(0,200,5,0.5)" />
            </div>
          </div>
        )}

        {/* ── STRIKE ── */}
        <div style={{
          flex:"0 0 72px", display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          padding:"8px 4px",
          borderLeft:"1px solid rgba(255,255,255,0.05)",
          borderRight:"1px solid rgba(255,255,255,0.05)",
          background: isATM ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.2)",
        }}>
          <div style={{
            fontSize:13, fontWeight:isATM?600:400,
            fontFamily:"'DM Mono',monospace",
            color: isATM ? "#fff" : "rgba(255,255,255,0.7)",
            letterSpacing:"-0.02em",
          }}>
            {row.strike}
          </div>
          {isATM && (
            <div style={{ fontSize:8, color:"rgba(255,255,255,0.35)", textTransform:"uppercase", letterSpacing:"0.1em", marginTop:1 }}>ATM</div>
          )}
        </div>

        {/* ── PUT SIDE ── */}
        {(mode==="both"||mode==="puts") && (
          <div
            onClick={() => onSelect(row, "put")}
            style={{
              flex:1, display:"flex", alignItems:"center",
              padding:"10px 8px 6px",
              background: showPutDetail ? "rgba(255,80,0,0.06)" : putBg,
              cursor:"pointer",
              transition:"background 0.15s",
            }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,80,0,0.08)"}
            onMouseLeave={e=>e.currentTarget.style.background=showPutDetail?"rgba(255,80,0,0.06)":putBg}
          >
            <div style={{ display:"flex", flexDirection:"column", gap:3, width:"100%" }}>
              <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                <span style={{ ...cols.bid, fontSize:13, fontWeight:500, color:putITM?"#fff":"rgba(255,255,255,0.65)", fontFamily:"'DM Mono',monospace" }}>{fmt2(row.put.bid)}</span>
                <span style={{ ...cols.ask, fontSize:12, color:"rgba(255,255,255,0.5)", fontFamily:"'DM Mono',monospace" }}>{fmt2(row.put.ask)}</span>
                <span style={{ ...cols.iv, fontSize:11, color:"rgba(255,255,255,0.35)", fontFamily:"'DM Mono',monospace" }}>{fmtPct(row.put.iv)}</span>
                <span style={{ ...cols.chg, fontSize:11, color:putChangeColor, fontFamily:"'DM Mono',monospace" }}>{row.put.change>=0?"+":""}{fmt2(row.put.change)}</span>
                <span style={{ ...cols.vol, fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"'DM Mono',monospace" }}>{fmtK(row.put.volume)}</span>
              </div>
              <OIBar value={row.put.oi} max={maxPutOI} color="rgba(255,80,0,0.5)" />
            </div>
          </div>
        )}
      </div>

      {/* Detail panels */}
      {showCallDetail && (
        <div style={{ padding:"8px 8px", background:"rgba(0,200,5,0.02)", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <ContractDetail row={row} type="call" expLabel={expLabel} onClose={()=>onSelect(null,null)} stockPrice={stockPrice} ticker={ticker} />
        </div>
      )}
      {showPutDetail && (
        <div style={{ padding:"8px 8px", background:"rgba(255,80,0,0.02)", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <ContractDetail row={row} type="put" expLabel={expLabel} onClose={()=>onSelect(null,null)} stockPrice={stockPrice} ticker={ticker} />
        </div>
      )}
    </>
  );
}


// ─── Main Component ────────────────────────────────────────────────────────
export default function OptionsChain({ ticker = '', calls, puts, currentPrice, expLabel, daysToExp }) {
  const [mode, setMode] = useState("both");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const STOCK_PRICE = currentPrice || 178.25;

  const chain = useMemo(() => {
    if (!calls?.length || !puts?.length || !currentPrice) return []
    const callMap = {}
    const putMap = {}
    calls.forEach(c => { callMap[c.strike] = c })
    puts.forEach(p => { putMap[p.strike] = p })
    const strikes = [...new Set([...calls.map(c => c.strike), ...puts.map(p => p.strike)])].sort((a,b) => a - b)
    return strikes.map(K => {
      const c = callMap[K] || {}
      const p = putMap[K] || {}
      const iv = parseFloat(c.impliedVolatility || p.impliedVolatility) || 0.3
      const T = (daysToExp || 30) / 365
      const callBS = bs(STOCK_PRICE, K, T, 0.05, iv, "call")
      const putBS = bs(STOCK_PRICE, K, T, 0.05, iv, "put")
      return {
        strike: K,
        call: {
          bid: parseFloat(c.bid) || 0,
          ask: parseFloat(c.ask) || 0,
          mid: (parseFloat(c.bid) + parseFloat(c.ask)) / 2 || callBS.price,
          volume: c.volume || 0,
          oi: c.openInterest || 0,
          iv: iv,
          change: (Math.random() - 0.5) * 0.5,
          delta: callBS.delta,
          gamma: callBS.gamma,
          theta: callBS.theta,
          vega: callBS.vega,
        },
        put: {
          bid: parseFloat(p.bid) || 0,
          ask: parseFloat(p.ask) || 0,
          mid: (parseFloat(p.bid) + parseFloat(p.ask)) / 2 || putBS.price,
          volume: p.volume || 0,
          oi: p.openInterest || 0,
          iv: iv,
          change: (Math.random() - 0.5) * 0.5,
          delta: putBS.delta,
          gamma: putBS.gamma,
          theta: putBS.theta,
          vega: putBS.vega,
        }
      }
    })
  }, [calls, puts, currentPrice, daysToExp])

  const filtered = useMemo(() => {
    if (!chain.length) return []
    if (filter==="itm") return chain.filter(r => r.strike < STOCK_PRICE);
    if (filter==="otm") return chain.filter(r => r.strike > STOCK_PRICE);
    return chain;
  }, [chain, filter]);

  const maxCallOI = useMemo(() => Math.max(...chain.map(r=>r.call.oi), 1), [chain]);
  const maxPutOI  = useMemo(() => Math.max(...chain.map(r=>r.put.oi), 1), [chain]);

  const totalCallOI = useMemo(()=>chain.reduce((s,r)=>s+r.call.oi,0),[chain]);
  const totalPutOI  = useMemo(()=>chain.reduce((s,r)=>s+r.put.oi,0),[chain]);
  const pcRatio = (totalPutOI/totalCallOI).toFixed(2);

  const handleSelect = useCallback((row, type) => {
    if (!row) { setSelected(null); return; }
    setSelected(prev => prev?.strike===row.strike && prev?.type===type ? null : { strike:row.strike, type });
  }, []);

  if (!currentPrice) return null;

  return (
    <div style={{
      background:"#000", minHeight:"60vh", color:"#fff",
      fontFamily:"'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif",
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.06)'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
        @keyframes slideDown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }

        .mode-btn {
          flex:1; background:transparent; border:none; color:rgba(255,255,255,0.4);
          font-family:inherit; font-size:13px; font-weight:500; padding:8px 0;
          cursor:pointer; border-radius:8px; transition:all 0.15s;
        }
        .mode-btn.active { background:rgba(255,255,255,0.1); color:#fff; }

        .filter-btn {
          background:transparent; border:none; color:rgba(255,255,255,0.35);
          font-family:inherit; font-size:12px; padding:4px 10px;
          cursor:pointer; border-radius:12px; transition:all 0.12s;
        }
        .filter-btn.active { background:rgba(255,255,255,0.08); color:#fff; }
      `}</style>

      {/* ── Controls ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        {/* Mode toggle */}
        <div style={{ display:"flex", background:"rgba(255,255,255,0.05)", borderRadius:10, padding:3, gap:2 }}>
          {[["calls","Calls"],["both","Both"],["puts","Puts"]].map(([val,label])=>(
            <button key={val} className={`mode-btn${mode===val?" active":""}`} style={{ minWidth:54 }} onClick={()=>setMode(val)}>{label}</button>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display:"flex", gap:2 }}>
          {[["all","All"],["itm","ITM"],["otm","OTM"]].map(([val,label])=>(
            <button key={val} className={`filter-btn${filter===val?" active":""}`} onClick={()=>setFilter(val)}>{label}</button>
          ))}
        </div>

        <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"'DM Mono',monospace" }}>
          {ticker} · {daysToExp}d · {expLabel} · P/C: {pcRatio}
        </div>
      </div>

      {/* ── Column Headers ── */}
      <div style={{
        display:"flex", alignItems:"center",
        padding:"8px 8px",
        background:"rgba(0,0,0,0.5)",
        borderBottom:"1px solid rgba(255,255,255,0.06)",
        position:"sticky", top:0, zIndex:10,
      }}>
        {(mode==="both"||mode==="calls") && (
          <div style={{ flex:1, display:"flex", justifyContent:"flex-end", gap:6, paddingRight:4 }}>
            {["Volume","Change","IV","Bid","Ask"].map(h=>(
              <span key={h} style={{ fontSize:10, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"0.07em", flex:"0 0 52px", textAlign:"right", fontFamily:"'DM Mono',monospace" }}>{h}</span>
            ))}
          </div>
        )}
        <div style={{ flex:"0 0 72px", textAlign:"center", fontSize:10, color:"rgba(255,255,255,0.3)", textTransform:"uppercase", letterSpacing:"0.08em", fontFamily:"'DM Mono',monospace" }}>
          Strike
        </div>
        {(mode==="both"||mode==="puts") && (
          <div style={{ flex:1, display:"flex", justifyContent:"flex-start", gap:6, paddingLeft:4 }}>
            {["Bid","Ask","IV","Change","Volume"].map(h=>(
              <span key={h} style={{ fontSize:10, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"0.07em", flex:"0 0 52px", textAlign:"left", fontFamily:"'DM Mono',monospace" }}>{h}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Chain ── */}
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {filtered.map(row => (
            <ChainRow
              key={row.strike}
              row={row}
              maxCallOI={maxCallOI}
              maxPutOI={maxPutOI}
              mode={mode}
              selected={selected}
              onSelect={handleSelect}
              expLabel={expLabel}
              stockPrice={STOCK_PRICE}
              ticker={ticker}
            />
        ))}
      </div>
    </div>
  );
}
