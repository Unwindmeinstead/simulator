import { useState, useEffect, useCallback } from "react";

function erf(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1; x = Math.abs(x);
  const t = 1 / (1 + p * x);
  return sign * (1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x));
}
const N = x => (1 + erf(x / Math.sqrt(2))) / 2;

function calculateDelta(S, K, T, r, sigma, type) {
  if (T <= 0.0001) return type === "call" ? (S > K ? 1 : 0) : (S < K ? -1 : 0);
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  return type === "call" ? N(d1) : N(d1) - 1;
}

function calculateFlowScore(volume, oi, otherVol, otherOI, S, K) {
  let score = 0;
  
  const vol = volume || 0;
  const openInt = oi || 1;
  const oVol = otherVol || 0;
  const oOI = otherOI || 1;
  
  const volOI = vol / openInt;
  const oVolOI = oVol / oOI;
  
  if (volOI > 2) score += 30;
  else if (volOI > 1.5) score += 15;
  
  if (oVolOI > 2) score -= 30;
  else if (oVolOI > 1.5) score -= 15;
  
  if (openInt > oOI * 2) score += 20;
  else if (openInt > oOI * 1.5) score += 10;
  
  if (oOI > openInt * 2) score -= 20;
  else if (oOI > openInt * 1.5) score -= 10;
  
  const moneyness = K / S;
  if (Math.abs(moneyness - 1) < 0.05) {
    if (vol > oVol) score += 10;
    else if (oVol > vol) score -= 10;
  }
  
  return Math.max(-100, Math.min(100, score));
}

function getIVClassification(iv) {
  if (iv < 0.25) return { label: "LOW", score: 20, color: "#00ff88" };
  if (iv < 0.40) return { label: "MOD", score: 0, color: "#ffaa00" };
  return { label: "HIGH", score: -25, color: "#ff5050" };
}

function calculateThetaValue(S, K, T, r, sigma, type) {
  if (T <= 0.0001) return 0;
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const nd1 = N(d1);
  const nprime = Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI);
  if (type === "call") {
    return (-(S * sigma * nprime) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * nd1) / 365;
  }
  return (-(S * sigma * nprime) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * (1 - nd1)) / 365;
}

function calculateQuantScore(flowScore, iv, dteYield, delta, isCall) {
  const ivClass = getIVClassification(iv);
  
  const flow = flowScore * 0.30;
  const ivEdge = ivClass.score * 0.30;
  const yieldScore = Math.min(dteYield * 2, 25) * 0.25;
  
  const deltaIdeal = 0.30;
  const deltaScore = (1 - Math.abs(delta - deltaIdeal) / 0.5) * 15;
  
  const total = flow + ivEdge + yieldScore + deltaScore;
  return Math.max(-100, Math.min(100, Math.round(total)));
}

function getQuantScoreColor(score) {
  if (score >= 30) return "#00ff88";
  if (score >= 10) return "#88ffaa";
  if (score >= -9) return "#ffdd00";
  if (score >= -29) return "#ffaa00";
  return "#ff5050";
}

function getQuantScoreLabel(score) {
  if (score >= 30) return "★ BUY";
  if (score >= 10) return "BUY";
  if (score >= -9) return "NEUTRAL";
  if (score >= -29) return "SELL";
  return "★ SELL";
}

const f2 = n => n?.toFixed(2) ?? "—";
const fPct = n => (n * 100).toFixed(1) + "%";
const fK = n => n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n ?? 0);

const POPULAR_STOCKS = ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'AMD', 'SPY', 'QQQ', 'COIN', 'PLTR', 'JPM', 'NFLX', 'DIS', 'AMAT', 'MU', 'INTC', 'CRM', 'ORCL'];

const getWatchlist = () => {
  try {
    const saved = localStorage.getItem('wheel_watchlist');
    return saved ? JSON.parse(saved) : ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'AMD'];
  } catch {
    return ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'AMD'];
  }
};

export default function OptionScanner() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [selectedResult, setSelectedResult] = useState(null);
  const [sortCol, setSortCol] = useState("quantScore");
  const [sortDir, setSortDir] = useState("desc");
  const [filters, setFilters] = useState({
    stockSource: "popular",
    watchlist: getWatchlist(),
    minDelta: 0.10,
    maxDelta: 0.50,
    minDTE: 7,
    maxDTE: 45,
    minROI: 5,
    maxStockPrice: 500,
    minPremium: 0,
    strategy: "both",
    budget: 10000,
    hasBid: false
  });

  const setFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
  };

  const removeFromWatchlist = (sym) => {
    setFilters(f => ({
      ...f,
      watchlist: f.watchlist.filter(s => s !== sym)
    }));
  };

  const addToWatchlist = (sym) => {
    const upper = sym.toUpperCase().trim();
    if (upper && !filters.watchlist.includes(upper)) {
      setFilters(f => ({
        ...f,
        watchlist: [...f.watchlist, upper]
      }));
    }
  };

  const toggleFilter = (key, value, current) => {
    setFilters(f => ({ ...f, [key]: current === value ? null : value }));
  };

  const getStocksToScan = () => {
    if (filters.stockSource === "watchlist" && filters.watchlist?.length > 0) {
      return filters.watchlist;
    }
    return POPULAR_STOCKS;
  };

  const getEffectiveFilters = () => ({
    minDelta: filters.minDelta ?? 0.05,
    maxDelta: filters.maxDelta ?? 0.50,
    minDTE: filters.minDTE ?? 0,
    maxDTE: filters.maxDTE ?? 999,
    minROI: filters.minROI ?? 0,
    maxStockPrice: filters.maxStockPrice ?? 99999,
    minPremium: filters.minPremium ?? 0,
    strategy: filters.strategy || "both",
    hasBid: filters.hasBid ?? false
  });

  const resetFilters = () => {
    setFilters(f => ({
      ...f,
      minDelta: 0.10,
      maxDelta: 0.50,
      minDTE: 7,
      maxDTE: 45,
      minROI: 5,
      maxStockPrice: 500,
      minPremium: 0,
      strategy: "both",
      hasBid: false,
      budget: 10000
    }));
  };

  const scan = useCallback(async () => {
    setLoading(true);
    setResults([]);
    const scanResults = [];
    const stocksToScan = getStocksToScan();
    const eff = getEffectiveFilters();
    console.log("Scanning stocks:", stocksToScan, "filters:", eff);
    
    for (const sym of stocksToScan) {
      setProgress(`Scanning ${sym}...`);
      
      try {
        // Fetch quote
        const quoteRes = await fetch(`/api/quote?symbol=${sym}&_t=${Date.now()}`);
        const quote = await quoteRes.json();
        console.log("Quote for", sym, ":", quote);
        const S = quote.regularMarketPrice;
        console.log("Stock price S:", S);
        
        if (!S || S > eff.maxStockPrice) {
          console.log("Skipping", sym, "- price issue");
          continue;
        }
        
        // Fetch options
        const optRes = await fetch(`/api/options?symbol=${sym}&_t=${Date.now()}`);
        const optData = await optRes.json();
        console.log("Options for", sym, ":", optData);
        
        if (!optData?.options?.length) {
          console.log("Skipping", sym, "- no options");
          continue;
        }
        
        const options = optData.options;
        
        for (const opt of options) {
          const calls = opt.calls || [];
          const puts = opt.puts || [];
          
          const expDate = new Date(opt.expirationDate);
          const dte = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const T = dte / 365;
          const expStr = expDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          
          console.log("Option exp:", opt.expirationDate, "dte:", dte);
          
          if (dte < eff.minDTE || dte > eff.maxDTE) continue;
          
          if (eff.strategy === "cc" || eff.strategy === "both") {
            for (const c of calls) {
              const bid = c.bid || 0;
              const ask = c.ask || 0;
              const mid = (bid + ask) / 2;
              const K = parseFloat(c.strike);
              const vol = c.volume || 0;
              const iv = parseFloat(c.impliedVolatility) || 0.3;
              const oi = c.openInterest || 0;
              
              const matchingPut = puts.find(p => Math.abs(parseFloat(p.strike) - K) < 0.01);
              const putVol = matchingPut?.volume || 0;
              const putOI = matchingPut?.openInterest || 0;
              
               const delta = calculateDelta(S, K, T, 0.05, iv, "call");
               const flowScore = calculateFlowScore(vol, oi, putVol, putOI, S, K);
               const ivClass = getIVClassification(iv);
               
               if (delta >= eff.minDelta && delta <= eff.maxDelta && mid >= eff.minPremium && K >= S && (!eff.hasBid || bid > 0)) {
                 const dteYield = (mid / S) * 100;
                 const annYield = dteYield * (365 / dte);
                 const quantScore = calculateQuantScore(flowScore, iv, dteYield, delta, true);
                 
                 if (dteYield >= eff.minROI) {
                  scanResults.push({
                    type: "CC",
                    ticker: sym,
                    S,
                    K,
                    dte,
                    expStr,
                    side: "call",
                    bid,
                    ask,
                    mid,
                    delta,
                    iv,
                    ivClass: ivClass.label,
                    volume: vol,
                    oi: oi,
                    dteYield,
                    annYield,
                    flowScore,
                    quantScore
                  });
                }
              }
            }
          }
          
          // Process puts (CSP)
          if (eff.strategy === "csp" || eff.strategy === "both") {
            for (const p of puts) {
              const bid = p.bid || 0;
              const ask = p.ask || 0;
              const mid = (bid + ask) / 2;
              const K = parseFloat(p.strike);
              const vol = p.volume || 0;
              const iv = parseFloat(p.impliedVolatility) || 0.3;
               const oi = p.openInterest || 0;
               
                const matchingCall = calls.find(c => Math.abs(parseFloat(c.strike) - K) < 0.01);
                const callVol = matchingCall?.volume || 0;
                const callOI = matchingCall?.openInterest || 0;
                 
                const delta = Math.abs(calculateDelta(S, K, T, 0.05, iv, "put"));
                const flowScore = calculateFlowScore(vol, oi, callVol, callOI, S, K);
                const ivClass = getIVClassification(iv);
                
                if (delta >= eff.minDelta && delta <= eff.maxDelta && mid >= eff.minPremium && K <= S && (!eff.hasBid || bid > 0)) {
                  const dteYield = (mid / K) * 100;
                  const annYield = dteYield * (365 / dte);
                  const quantScore = calculateQuantScore(flowScore, iv, dteYield, delta, false);
                  
                  if (dteYield >= eff.minROI) {
                   scanResults.push({
                     type: "CSP",
                     ticker: sym,
                     S,
                     K,
                     dte,
                     expStr,
                     side: "put",
                     bid,
                     ask,
                     mid,
                     delta,
                     iv,
                     ivClass: ivClass.label,
                     volume: vol,
                     oi: oi,
                     dteYield,
                     annYield,
                     flowScore,
                     quantScore
                   });
                 }
               }
            }
          }
        }
      } catch (e) {
        console.error(`Error scanning ${sym}:`, e);
      }
    }
    
    // Sort by quant score first, then by DTE yield
    scanResults.sort((a, b) => {
      if (b.quantScore !== a.quantScore) return b.quantScore - a.quantScore;
      return b.dteYield - a.dteYield;
    });
    console.log("Scan complete, results:", scanResults.length);
    setResults(scanResults.slice(0, 100));
    setLoading(false);
    setProgress("");
  }, [filters]);

  return (
    <div style={{
      background: "#000",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.06)",
      overflow: "hidden",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        .sc-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.5);
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .sc-btn:hover { background: rgba(255,255,255,0.05); color: #fff; }
        .sc-btn.active { background: rgba(0,255,136,0.15); border-color: #00ff88; color: #00ff88; }
        .scan-btn {
          background: #00ff88;
          border: none;
          color: #000;
          font-size: 12px;
          font-weight: 600;
          padding: 8px 20px;
          border-radius: 6px;
          cursor: pointer;
        }
        .scan-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
      
      {/* Header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
            Option Scanner
            {progress && <span style={{ fontSize: 11, color: "#00ff88", marginLeft: 8 }}>{progress}</span>}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {/* Stock Source */}
            <div style={{ display: "flex", gap: 2, marginRight: 8 }}>
              {[
                { v: "popular", l: "Popular" },
                { v: "watchlist", l: "My Watchlist" }
              ].map(o => (
                <button
                  key={o.v}
                  className={`sc-btn ${filters.stockSource === o.v ? "active" : ""}`}
                  onClick={() => setFilter("stockSource", o.v)}
                >
                  {o.l}
                </button>
              ))}
            </div>
            {["both", "cc", "csp"].map(s => (
              <button
                key={s}
                className={`sc-btn ${filters.strategy === s ? "active" : ""}`}
                onClick={() => toggleFilter("strategy", s, filters.strategy)}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        
        {/* Watchlist stocks */}
        {filters.stockSource === "watchlist" && (
          <div style={{ padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <input
                id="wl-add"
                placeholder="Add symbol..."
                onKeyDown={e => { if (e.key === "Enter") { addToWatchlist(e.target.value); e.target.value = ""; } }}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: 10,
                  color: "#fff",
                  width: 90,
                  outline: "none"
                }}
              />
              <button
                onClick={() => { const el = document.getElementById("wl-add"); if (el.value) { addToWatchlist(el.value); el.value = ""; } }}
                style={{
                  background: "#00ff88",
                  border: "none",
                  borderRadius: 4,
                  padding: "4px 8px",
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Add
              </button>
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {filters.watchlist.map(sym => (
                <div key={sym} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 4, fontSize: 10 }}>
                  <span style={{ color: "#fff", fontFamily: "'DM Mono', monospace" }}>{sym}</span>
                  <button
                    onClick={() => removeFromWatchlist(sym)}
                    style={{
                      background: "rgba(255,80,80,0.2)",
                      border: "none",
                      borderRadius: 3,
                      color: "#ff5050",
                      cursor: "pointer",
                      padding: "1px 4px",
                      fontSize: 10,
                      lineHeight: 1,
                      fontWeight: 600
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          {/* Delta */}
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Delta</div>
            <div style={{ display: "flex", gap: 2 }}>
              {[0.10, 0.15, 0.20, 0.25, 0.30].map(v => (
                <button key={v} className={`sc-btn ${filters.minDelta === v ? "active" : ""}`} onClick={() => toggleFilter("minDelta", v, filters.minDelta)}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          
          {/* DTE */}
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>DTE</div>
            <div style={{ display: "flex", gap: 2 }}>
              {[7, 14, 21, 30, 45, 60, 90].map(v => (
                <button key={v} className={`sc-btn ${filters.maxDTE === v ? "active" : ""}`} onClick={() => toggleFilter("maxDTE", v, filters.maxDTE)}>
                  {v}d
                </button>
              ))}
            </div>
          </div>
          
          {/* ROI */}
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Min DTE %</div>
            <div style={{ display: "flex", gap: 2 }}>
              {[5, 10, 15, 20, 30, 50].map(v => (
                <button key={v} className={`sc-btn ${filters.minROI === v ? "active" : ""}`} onClick={() => toggleFilter("minROI", v, filters.minROI)}>
                  {v}%
                </button>
              ))}
            </div>
          </div>
          
          {/* Stock Price */}
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Stock Under</div>
            <div style={{ display: "flex", gap: 2 }}>
              {[10, 20, 50, 100, 200, 500, 1000].map(v => (
                <button key={v} className={`sc-btn ${filters.maxStockPrice === v ? "active" : ""}`} onClick={() => toggleFilter("maxStockPrice", v, filters.maxStockPrice)}>
                  ${v}
                </button>
              ))}
            </div>
          </div>

          {/* Has Bid */}
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Require</div>
            <div style={{ display: "flex", gap: 2 }}>
              <button 
                className={`sc-btn ${filters.hasBid ? "active" : ""}`} 
                onClick={() => setFilter("hasBid", !filters.hasBid)}
              >
                Has Bid
              </button>
            </div>
          </div>
          
          {/* Min Premium */}
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Min Prem</div>
            <div style={{ display: "flex", gap: 2 }}>
              {[0, 0.50, 1.00, 2.00, 5.00].map(v => (
                <button key={v} className={`sc-btn ${filters.minPremium === v ? "active" : ""}`} onClick={() => toggleFilter("minPremium", v, filters.minPremium)}>
                  ${v.toFixed(2)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Budget */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>Budget $</div>
            <input
              type="number"
              value={filters.budget}
              onChange={e => setFilter("budget", parseInt(e.target.value) || 10000)}
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                padding: "4px 8px",
                fontSize: 10,
                color: "#fff",
                width: 70,
                outline: "none"
              }}
            />
          </div>
          
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button className="scan-btn" onClick={resetFilters} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}>
              Reset
            </button>
            <button className="scan-btn" onClick={scan} disabled={loading}>
              {loading ? "Scanning..." : "Scan"}
            </button>
          </div>
        </div>
      </div>
      
      {/* Results */}
      <div style={{ maxHeight: 800, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center", color: "#00ff88" }}>
            {progress || "Scanning..."}
          </div>
        ) : results.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
            Click Scan to find opportunities
          </div>
        ) : (
          <div>
            {/* DTE Range Label */}
            <div style={{ padding: "8px 12px", background: "rgba(0,255,136,0.08)", borderBottom: "1px solid rgba(0,255,136,0.15)", fontSize: 10, color: "#00ff88", fontWeight: 500 }}>
              Targeting {filters.minDTE}-{filters.maxDTE} DTE with {filters.minROI}%+ yield
            </div>
            {/* Header */}
            <div style={{ display: "flex", padding: "8px 12px", background: "rgba(0,0,0,0.5)", fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", alignItems: "center" }}>
              <div style={{ width: 50, cursor: "pointer" }} onClick={() => { setSortCol("type"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }}>Type {sortCol === "type" && (sortDir === "asc" ? "↑" : "↓")}</div>
              <div style={{ width: 50, cursor: "pointer" }} onClick={() => { setSortCol("ticker"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }}>Stock {sortCol === "ticker" && (sortDir === "asc" ? "↑" : "↓")}</div>
              <div style={{ width: 50, cursor: "pointer" }} onClick={() => { setSortCol("S"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }}>Price {sortCol === "S" && (sortDir === "asc" ? "↑" : "↓")}</div>
              <div style={{ width: 55, cursor: "pointer" }} onClick={() => { setSortCol("K"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }}>Strike {sortCol === "K" && (sortDir === "asc" ? "↑" : "↓")}</div>
              <div style={{ width: 45 }}>Bid</div>
              <div style={{ width: 45 }}>Ask</div>
              <div style={{ width: 40, cursor: "pointer" }} onClick={() => { setSortCol("delta"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }}>Δ {sortCol === "delta" && (sortDir === "asc" ? "↑" : "↓")}</div>
              <div style={{ width: 45, cursor: "pointer" }} onClick={() => { setSortCol("iv"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }}>IV {sortCol === "iv" && (sortDir === "asc" ? "↑" : "↓")}</div>
              <div style={{ width: 40 }}>IV</div>
              <div style={{ width: 40, cursor: "pointer" }} onClick={() => { setSortCol("volume"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }}>Vol {sortCol === "volume" && (sortDir === "asc" ? "↑" : "↓")}</div>
              <div style={{ width: 35, cursor: "pointer" }} onClick={() => { setSortCol("dte"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }}>DTE {sortCol === "dte" && (sortDir === "asc" ? "↑" : "↓")}</div>
              <div style={{ width: 50, color: "#00ff88", cursor: "pointer" }} onClick={() => { setSortCol("dteYield"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }}>DTE% {sortCol === "dteYield" && (sortDir === "asc" ? "↑" : "↓")}</div>
              <div style={{ width: 50, cursor: "pointer" }} onClick={() => { setSortCol("annYield"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }}>Ann% {sortCol === "annYield" && (sortDir === "asc" ? "↑" : "↓")}</div>
              <div style={{ width: 50, color: "#ffaa00", cursor: "pointer" }} onClick={() => { setSortCol("quantScore"); setSortDir(sortDir === "asc" ? "desc" : "asc"); }}>Quant {sortCol === "quantScore" && (sortDir === "asc" ? "↑" : "↓")}</div>
            </div>
            
            {/* Rows */}
            {(() => {
              const sorted = [...results].sort((a, b) => {
                let aVal = a[sortCol];
                let bVal = b[sortCol];
                if (typeof aVal === "string") aVal = aVal.toLowerCase();
                if (typeof bVal === "string") bVal = bVal.toLowerCase();
                if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
                if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
                return 0;
              });
              return sorted.map((r, i) => (
              <div 
                key={i} 
                onClick={() => { console.log("Clicked result:", r); setSelectedResult(r); }}
                onMouseEnter={(e) => e.currentTarget.style.background = r.side === "call" ? "rgba(0,255,136,0.15)" : "rgba(255,100,0,0.15)"}
                onMouseLeave={(e) => e.currentTarget.style.background = r.side === "call" ? "rgba(0,200,5,0.02)" : "rgba(255,80,0,0.02)"}
                style={{ 
                display: "flex", 
                padding: "8px 12px", 
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                background: r.side === "call" ? "rgba(0,200,5,0.02)" : "rgba(255,80,0,0.02)",
                fontSize: 11,
                fontFamily: "'DM Mono', monospace",
                cursor: "pointer",
              }}>
                <div style={{ width: 50, color: r.side === "call" ? "#00c805" : "#ff5000", fontWeight: 600 }}>{r.type}</div>
                <div style={{ width: 50, color: "#fff", fontWeight: 600 }}>{r.ticker}</div>
                <div style={{ width: 50, color: "rgba(255,255,255,0.6)" }}>${r.S}</div>
                <div style={{ width: 55, color: "#fff" }}>${r.K}</div>
                <div style={{ width: 45, color: "rgba(255,255,255,0.6)" }}>{f2(r.bid)}</div>
                <div style={{ width: 45, color: "rgba(255,255,255,0.6)" }}>{f2(r.ask)}</div>
                <div style={{ width: 40, color: "rgba(255,255,255,0.6)" }}>{r.delta.toFixed(2)}</div>
                <div style={{ width: 45, color: "rgba(255,255,255,0.5)" }}>{fPct(r.iv)}</div>
                <div style={{ width: 40, color: r.ivClass === "LOW" ? "#00ff88" : r.ivClass === "HIGH" ? "#ff5050" : "#ffaa00", fontWeight: 600, fontSize: 9 }}>
                  {r.ivClass || "—"}
                </div>
                <div style={{ width: 40, color: "rgba(255,255,255,0.5)" }}>{fK(r.volume)}</div>
                <div style={{ width: 35, color: "rgba(255,255,255,0.5)" }}>{r.dte}d</div>
                <div style={{ width: 50, color: "#00ff88", fontWeight: 600 }}>{r.dteYield?.toFixed(2) ?? '—'}%</div>
                <div style={{ width: 50, color: "rgba(255,255,255,0.5)" }}>{r.annYield?.toFixed(1) ?? '—'}%</div>
                <div style={{ width: 40, color: getQuantScoreColor(r.quantScore), fontWeight: 600, fontSize: 10 }}>
                  {r.quantScore > 0 ? "+" : ""}{r.quantScore}
                </div>
              </div>
            ));
            })()}
          </div>
        )}
      </div>
      
      {/* Quant Analysis Card */}
      {selectedResult && (
        <QuantAnalysisCard 
          result={selectedResult} 
          budget={filters.budget}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  );
}

function calculateGreeks(S, K, T, r, sigma, type) {
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const nd1 = N(d1);
  const nd2 = N(d2);
  const nprime = Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI);
  
  const gamma = nprime / (S * sigma * Math.sqrt(T));
  const vega = S * Math.sqrt(T) * nprime / 100;
  const theta = type === "call" 
    ? (-(S * sigma * nprime) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * nd2) / 365
    : (-(S * sigma * nprime) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * (1 - nd2)) / 365;
  
  return {
    delta: type === "call" ? nd1 : nd1 - 1,
    gamma,
    theta,
    vega
  };
}

function analyzeOptionFlow(result, allOptions, S) {
  const analysis = {
    flowScore: 0,
    mmPositioning: "neutral",
    sentiment: "neutral",
    riskFactors: [],
    opportunities: []
  };
  
  const calls = allOptions.calls || [];
  const puts = allOptions.puts || [];
  const strikeIdx = calls.findIndex(c => parseFloat(c.strike) === result.K);
  
  if (strikeIdx >= 0) {
    const callVol = calls[strikeIdx].volume || 0;
    const callOI = calls[strikeIdx].openInterest || 1;
    const putVol = puts[strikeIdx]?.volume || 0;
    const putOI = puts[strikeIdx]?.openInterest || 1;
    
    const callVolOI = callVol / callOI;
    const putVolOI = putVol / putOI;
    
    if (callVolOI > 2) {
      analysis.flowScore += 30;
      analysis.mmPositioning = "bullish";
      analysis.opportunities.push("Unusual call volume - institutions buying");
    } else if (putVolOI > 2) {
      analysis.flowScore -= 30;
      analysis.mmPositioning = "bearish";
      analysis.opportunities.push("Unusual put volume - hedging pressure");
    }
    
    if (callOI > putOI * 2) {
      analysis.flowScore += 20;
      analysis.sentiment = "bullish";
      analysis.opportunities.push("High call OI suggests resistance building");
    } else if (putOI > callOI * 2) {
      analysis.flowScore -= 20;
      analysis.sentiment = "bearish";
      analysis.opportunities.push("High put OI suggests support at this level");
    }
  }
  
  const atmCalls = calls.filter(c => {
    const k = parseFloat(c.strike);
    return k >= S * 0.95 && k <= S * 1.05;
  });
  
  const atmPuts = puts.filter(c => {
    const k = parseFloat(c.strike);
    return k >= S * 0.95 && k <= S * 1.05;
  });
  
  const avgCallVol = atmCalls.reduce((a, c) => a + (c.volume || 0), 0) / Math.max(atmCalls.length, 1);
  const avgPutVol = atmPuts.reduce((a, c) => a + (c.volume || 0), 0) / Math.max(atmPuts.length, 1);
  
  if (avgCallVol > avgPutVol * 1.5) {
    analysis.flowScore += 15;
    analysis.opportunities.push("Call volume dominance at ATM - bullish bias");
  } else if (avgPutVol > avgCallVol * 1.5) {
    analysis.flowScore -= 15;
    analysis.opportunities.push("Put volume dominance at ATM - bearish bias");
  }
  
  const highVolStrikes = calls.filter(c => (c.volume || 0) > 10000).map(c => parseFloat(c.strike));
  if (highVolStrikes.length > 0) {
    const nearest = highVolStrikes.reduce((a, b) => Math.abs(b - S) < Math.abs(a - S) ? b : a);
    if (nearest > S) {
      analysis.riskFactors.push(`High volume clustered at $${nearest} - potential resistance`);
    } else {
      analysis.riskFactors.push(`High volume clustered at $${nearest} - potential support`);
    }
  }
  
  analysis.flowScore = Math.max(-100, Math.min(100, analysis.flowScore));
  
  return analysis;
}

function QuantAnalysisCard({ result, budget, onClose }) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [allOptions, setAllOptions] = useState(null);
  
  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const optRes = await fetch(`/api/options?symbol=${result.ticker}&_t=${Date.now()}`);
        const optData = await optRes.json();
        
        const expOpts = optData.options?.find(o => {
          const expDate = new Date(o.expirationDate);
          return Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) === result.dte;
        });
        
        setAllOptions(expOpts || null);
        
        const T = result.dte / 365;
        const greeks = calculateGreeks(result.S, result.K, T, 0.05, result.iv, result.side);
        
        const contracts = Math.floor(budget / (result.K * 100));
        const premiumTotal = result.mid * contracts * 100;
        const maxLoss = result.side === "call" 
          ? (result.K * 100 * contracts) - premiumTotal
          : result.K * 100 * contracts;
        const roiPercent = (premiumTotal / (result.side === "call" ? result.K * 100 * contracts : budget)) * 100;
        const cashSecured = result.side === "put" ? result.K * 100 * contracts : 0;
        
        const analysisResult = analyzeOptionFlow(result, expOpts || { calls: [], puts: [] }, result.S);
        
        setAnalysis({
          ...greeks,
          ...analysisResult,
          contracts,
          premiumTotal,
          maxLoss,
          roiPercent,
          cashSecured,
          breakeven: result.side === "call" ? result.K - result.mid : result.K + result.mid,
          riskReward: (result.mid * 100) / (result.side === "call" ? result.K - result.mid : result.K),
          thetaDecay: Math.abs(greeks.theta) * contracts * 100,
          deltaExposure: greeks.delta * contracts * 100,
          gammaRisk: greeks.gamma * contracts * 100
        });
      } catch (e) {
        console.error("Analysis error:", e);
      }
      setLoading(false);
    }
    
    fetchAnalysis();
  }, [result, budget]);
  
  const getSignalColor = (score) => {
    if (score >= 30) return "#00ff88";
    if (score >= 10) return "#88ffaa";
    if (score <= -30) return "#ff5050";
    if (score <= -10) return "#ffaa88";
    return "#888";
  };
  
  const getSignalLabel = (score) => {
    if (score >= 30) return "STRONG BUY";
    if (score >= 10) return "BUY";
    if (score <= -30) return "STRONG SELL";
    if (score <= -10) return "SELL";
    return "NEUTRAL";
  };
  
  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.9)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: 20
    }} onClick={onClose}>
      <div style={{
        background: "#0a0a0a",
        border: "1px solid rgba(0,255,136,0.3)",
        borderRadius: 16,
        width: "100%",
        maxWidth: 700,
        maxHeight: "90vh",
        overflow: "auto",
        padding: 24
      }} onClick={e => e.stopPropagation()}>
        {loading ? (
          <div style={{ color: "#00ff88", textAlign: "center", padding: 40 }}>Analyzing...</div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>
                  {result.ticker} {result.type}
                </div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                  ${result.S} → ${result.K} · {result.dte} DTE · {result.side.toUpperCase()}
                </div>
              </div>
              <button onClick={onClose} style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: 8,
                color: "#fff",
                padding: "8px 16px",
                cursor: "pointer",
                fontSize: 14
              }}>Close</button>
            </div>
            
            {/* Signal Banner */}
            <div style={{
              background: `${getSignalColor(analysis.flowScore)}15`,
              border: `1px solid ${getSignalColor(analysis.flowScore)}`,
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>QUANT SIGNAL</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: getSignalColor(analysis.flowScore) }}>
                  {getSignalLabel(analysis.flowScore)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>FLOW SCORE</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: getSignalColor(analysis.flowScore) }}>
                  {analysis.flowScore > 0 ? "+" : ""}{analysis.flowScore}
                </div>
              </div>
            </div>
            
            {/* Position Sizing */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase" }}>Position Simulation</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Budget</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>${budget.toLocaleString()}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Contracts</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#00ff88" }}>{analysis.contracts}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Premium</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#00ff88" }}>${analysis.premiumTotal.toFixed(0)}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>ROI</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: analysis.roiPercent > 5 ? "#00ff88" : "#ffaa88" }}>
                    {analysis.roiPercent.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
            
            {/* Greeks */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase" }}>The Greeks</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                <div style={{ background: "rgba(0,255,136,0.05)", padding: 12, borderRadius: 8, border: "1px solid rgba(0,255,136,0.1)" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Delta</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>{analysis.delta.toFixed(3)}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{analysis.deltaExposure.toFixed(0)} shares</div>
                </div>
                <div style={{ background: "rgba(0,255,136,0.05)", padding: 12, borderRadius: 8, border: "1px solid rgba(0,255,136,0.1)" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Gamma</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>{analysis.gamma.toFixed(4)}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{analysis.gammaRisk.toFixed(2)} per $1 move</div>
                </div>
                <div style={{ background: "rgba(255,100,0,0.05)", padding: 12, borderRadius: 8, border: "1px solid rgba(255,100,0,0.1)" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Theta</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#ffaa88" }}>{analysis.theta.toFixed(3)}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>${analysis.thetaDecay.toFixed(0)}/day decay</div>
                </div>
                <div style={{ background: "rgba(100,100,255,0.05)", padding: 12, borderRadius: 8, border: "1px solid rgba(100,100,255,0.1)" }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Vega</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: "#aaaaff" }}>{analysis.vega.toFixed(3)}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>per 1% IV change</div>
                </div>
              </div>
            </div>
            
            {/* Risk/Reward */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase" }}>Risk Analysis</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Breakeven</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>${analysis.breakeven.toFixed(2)}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Max Risk</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#ff5050" }}>${analysis.maxLoss.toFixed(0)}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Risk/Reward</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: analysis.riskReward > 1 ? "#00ff88" : "#ffaa88" }}>
                    1:{analysis.riskReward.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* MM Positioning & Flow */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase" }}>MM Positioning & Flow</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <div style={{
                  background: analysis.mmPositioning === "bullish" ? "rgba(0,255,136,0.15)" : 
                             analysis.mmPositioning === "bearish" ? "rgba(255,80,80,0.15)" : "rgba(255,255,255,0.1)",
                  border: `1px solid ${analysis.mmPositioning === "bullish" ? "#00ff88" : analysis.mmPositioning === "bearish" ? "#ff5050" : "#666"}`,
                  padding: "6px 12px", borderRadius: 6, fontSize: 11, color: "#fff"
                }}>
                  MM: {analysis.mmPositioning.toUpperCase()}
                </div>
                <div style={{
                  background: analysis.sentiment === "bullish" ? "rgba(0,255,136,0.15)" : 
                             analysis.sentiment === "bearish" ? "rgba(255,80,80,0.15)" : "rgba(255,255,255,0.1)",
                  border: `1px solid ${analysis.sentiment === "bullish" ? "#00ff88" : analysis.sentiment === "bearish" ? "#ff5050" : "#666"}`,
                  padding: "6px 12px", borderRadius: 6, fontSize: 11, color: "#fff"
                }}>
                  Sentiment: {analysis.sentiment.toUpperCase()}
                </div>
                <div style={{
                  background: "rgba(255,255,255,0.1)",
                  padding: "6px 12px", borderRadius: 6, fontSize: 11, color: "#fff"
                }}>
                  IV: {(result.iv * 100).toFixed(0)}%
                </div>
              </div>
              
              {analysis.opportunities.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>OPPORTUNITIES</div>
                  {analysis.opportunities.map((opp, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#00ff88", marginBottom: 4 }}>• {opp}</div>
                  ))}
                </div>
              )}
              
              {analysis.riskFactors.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>RISK FACTORS</div>
                  {analysis.riskFactors.map((risk, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#ffaa88", marginBottom: 4 }}>• {risk}</div>
                  ))}
                </div>
              )}
            </div>
            
            {/* IV Analysis */}
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8, textTransform: "uppercase" }}>IV Analysis</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Implied Volatility</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: result.iv > 0.5 ? "#ffaa88" : "#fff" }}>
                    {(result.iv * 100).toFixed(1)}%
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>IV Interpretation</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: result.iv > 0.6 ? "#ffaa88" : result.iv > 0.4 ? "#fff" : "#00ff88" }}>
                    {result.iv > 0.6 ? "HIGH - IV crush risk" : result.iv > 0.4 ? "Moderate" : "LOW - premium thin"}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
