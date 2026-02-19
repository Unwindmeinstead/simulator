import { useState } from "react";

const G = "rgba(255,255,255,0.055)";
const GB = "rgba(255,255,255,0.07)";
const GA = "rgba(0,224,122,0.07)";
const GAB = "rgba(0,224,122,0.22)";

const Mono = { fontFamily: "'JetBrains Mono','IBM Plex Mono',monospace" };

const Lbl = ({ children, c }) => (
  <div style={{ ...Mono, fontSize: 9, letterSpacing: "0.13em", textTransform: "uppercase", color: c || "rgba(255,255,255,0.32)", marginBottom: 6 }}>{children}</div>
);

const NumField = ({ label, value, onChange, pre, suf, step = "0.01", ph, note }) => (
  <div>
    <Lbl>{label}</Lbl>
    <div style={{ position: "relative" }}>
      {pre && <span style={{ ...Mono, position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "rgba(255,255,255,0.25)", pointerEvents: "none" }}>{pre}</span>}
      <input type="number" value={value} step={step} placeholder={ph || ""} onChange={(e) => onChange(e.target.value)}
        style={{ ...Mono, width: "100%", background: G, border: `1px solid ${GB}`, borderRadius: 7, padding: `9px ${suf ? "32px" : "10px"} 9px ${pre ? "24px" : "10px"}`, color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
        onFocus={(e) => (e.target.style.borderColor = GAB)}
        onBlur={(e)  => (e.target.style.borderColor = GB)} />
      {suf && <span style={{ ...Mono, position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: "rgba(255,255,255,0.25)", pointerEvents: "none" }}>{suf}</span>}
    </div>
    {note && <div style={{ ...Mono, fontSize: 9, color: "rgba(255,255,255,0.2)", marginTop: 3 }}>{note}</div>}
  </div>
);

const Card = ({ children, accent, warn, style: sx }) => (
  <div style={{ background: accent ? GA : warn ? "rgba(255,155,0,0.05)" : G, border: `1px solid ${accent ? GAB : warn ? "rgba(255,155,0,0.18)" : GB}`, borderRadius: 10, padding: "12px 14px", ...sx }}>
    {children}
  </div>
);

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ ...Mono, padding: "10px 14px", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", background: active ? GA : "transparent", border: `1px solid ${active ? GAB : GB}`, borderRadius: 8, color: active ? "#00e07a" : "rgba(255,255,255,0.38)", cursor: "pointer", transition: "all 0.15s", flex: 1, textAlign: "center" }}>
    {label}
  </button>
);

const generateMockStocks = (market) => {
  const sp500 = ["AAPL","MSFT","GOOGL","AMZN","NVDA","META","TSLA","BRK.B","UNH","JNJ","V","XOM","JPM","PG","MA","HD","CVX","LLY","ABBV","MRK","AVGO","PEP","COST","KO","WMT","TMO","MCD","CSCO","ACN","ABT","DHR","CRM","NFLX","ADBE","TXN","NKE","NEE","PM","BMY","UNP","RTX","HON","QCOM","LOW","INTC","AMD","IBM","GE","CAT","DE","BLK","INTU","AMGN","GILD","MDLZ","ADI","ISRG","T","BA","SPGI","NOW","BKNG","AXP","AMAT","C","SYK","MMM","TJX","CVS","LRCX","MO","PLD","ADP","MDT","ZTS","SBUX","CME","CB","CI","SO","DUK","NOC","BSX","EL","ITW","APD","EW","MMC","SHW","PFE","CL","COP","ETN","HUM","FCX","EOG","GM","NXPI","KLAC","MU","SNPS","CDNS","AON","MSI","PH","WM","BDX","ADSK","FIS","CBRE","GD","NSC","TT","MAR","APTV","CMI","ROK","PHM","ORLY","AIG","TRV","PRU","AFL","MET","ALL","SCHW","SPG","O","WELL","AMT","EQIX","PSA","CCI","DLR","AVB","EQR","VTR","WY","ARE","SLG"];
  const stocks = market === "sp500" ? sp500 : [...sp500, "RIVN","LCID","PLTR","SOFI","SNAP","ROKU","ZM","DOCU","CRWD","NET","DDOG","SNOW","SQ","PYPL","HOOD","PATH","ABNB","DASH","MARA","RIOT","MSTR","COIN","GRMN","FSLR","SEDG","ENPH","RUN","PLUG","BLNK","CHPT","QS","ALB","CLF","X","MT","NUE","STLD","AAL","DAL","UAL","LUV","F","TM","HMC","NIO","XPEV","LI"];
  
  return stocks.slice(0, market === "sp500" ? 50 : 80).map((symbol) => {
    const price = 20 + Math.random() * 480;
    const ma5 = price * (0.95 + Math.random() * 0.1);
    const ma10 = price * (0.92 + Math.random() * 0.16);
    return {
      symbol,
      price: price.toFixed(2),
      ma5: ma5.toFixed(2),
      ma10: ma10.toFixed(2),
      ma5AboveMa10: ma5 > ma10,
      priceAboveMa5: price > ma5,
      priceAboveMa10: price > ma10,
    };
  });
};

const generateMockOptions = (stock, strategy) => {
  const sp = parseFloat(stock.price);
  const strikes = [];
  const baseStrike = strategy === "cc" ? sp * (1 + Math.random() * 0.1) : sp * (1 - Math.random() * 0.1);
  
  for (let i = -3; i <= 3; i++) {
    strikes.push(baseStrike * (1 + i * 0.03));
  }
  
  const dteOptions = [7, 14, 21, 30];
  
  return strikes.flatMap((strike) => 
    dteOptions.map((dte) => {
      const otmPct = strategy === "cc" ? ((strike - sp) / sp) * 100 : ((sp - strike) / sp) * 100;
      const basePremium = Math.abs(otmPct) * 0.02 + Math.random() * 0.5;
      const premium = Math.max(0.05, basePremium);
      const openInterest = Math.floor(50 + Math.random() * 5000);
      const delta = strategy === "cc" 
        ? -0.05 - Math.random() * 0.35 
        : 0.05 + Math.random() * 0.35;
      
      const roi = strategy === "cc"
        ? (premium / (sp - premium)) * 100
        : (premium / (strike - premium)) * 100;
      
      const roiAssigned = strategy === "cc"
        ? ((premium + (strike - sp)) / (sp - premium)) * 100
        : null;
      
      return {
        symbol: stock.symbol,
        type: strategy,
        strike: strike.toFixed(2),
        premium: premium.toFixed(2),
        dte,
        otm: otmPct.toFixed(2),
        openInterest,
        roi: roi.toFixed(2),
        roiAssigned: roiAssigned ? roiAssigned.toFixed(2) : null,
        delta: delta.toFixed(3),
        moneyness: otmPct.toFixed(2),
      };
    })
  );
};

const filterStocks = (stocks, stockFilter) => {
  return stocks.filter((s) => {
    if (stockFilter.priceAboveMa5 && !s.priceAboveMa5) return false;
    if (stockFilter.priceAboveMa10 && !s.priceAboveMa10) return false;
    if (stockFilter.ma5AboveMa10 && !s.ma5AboveMa10) return false;
    return true;
  });
};

const filterOptions = (options, optionFilters) => {
  return options.filter((opt) => {
    const moneyness = parseFloat(opt.moneyness);
    if (optionFilters.moneynessMin && moneyness < optionFilters.moneynessMin) return false;
    if (optionFilters.moneynessMax && moneyness > optionFilters.moneynessMax) return false;
    if (optionFilters.minOpenInterest && opt.openInterest < optionFilters.minOpenInterest) return false;
    if (optionFilters.dteMax && opt.dte > optionFilters.dteMax) return false;
    const roi = parseFloat(opt.roi);
    if (optionFilters.roiMin && roi < optionFilters.roiMin) return false;
    const delta = Math.abs(parseFloat(opt.delta));
    if (optionFilters.deltaMax && delta > optionFilters.deltaMax) return false;
    return true;
  });
};

export default function OptionScreener() {
  const [market, setMarket] = useState("sp500");
  const [strategy, setStrategy] = useState("csp");
  const [stockFilter, setStockFilter] = useState({
    priceAboveMa5: false,
    priceAboveMa10: false,
    ma5AboveMa10: false,
  });
  const [optionFilters, setOptionFilters] = useState({
    moneynessMin: -25,
    moneynessMax: 0,
    minOpenInterest: 100,
    dteMax: 45,
    roiMin: 0,
    deltaMax: 0.5,
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const runScreener = () => {
    setLoading(true);
    setTimeout(() => {
      const stocks = generateMockStocks(market);
      const filteredStocks = filterStocks(stocks, stockFilter);
      const allOptions = filteredStocks.flatMap((stock) => generateMockOptions(stock, strategy));
      const filteredOptions = filterOptions(allOptions, optionFilters);
      const sorted = filteredOptions.sort((a, b) => parseFloat(b.roi) - parseFloat(a.roi)).slice(0, 50);
      setResults(sorted);
      setLoading(false);
    }, 500);
  };

  const updateOptionFilter = (key, value) => {
    setOptionFilters((prev) => ({ ...prev, [key]: value ? parseFloat(value) : null }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <Pill label="S&P 500" active={market === "sp500"} onClick={() => setMarket("sp500")} />
        <Pill label="Market" active={market === "whole"} onClick={() => setMarket("whole")} />
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <Pill label="CSP" active={strategy === "csp"} onClick={() => setStrategy("csp")} />
        <Pill label="CC" active={strategy === "cc"} onClick={() => setStrategy("cc")} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {[
          { key: "priceAboveMa5", label: "Price>MA5" },
          { key: "priceAboveMa10", label: "Price>MA10" },
          { key: "ma5AboveMa10", label: "MA5>MA10" },
        ].map(({ key, label }) => (
          <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: stockFilter[key] ? GA : G, padding: "6px 10px", borderRadius: 6, border: `1px solid ${stockFilter[key] ? GAB : GB}` }}>
            <input type="checkbox" checked={stockFilter[key]} onChange={(e) => setStockFilter((prev) => ({ ...prev, [key]: e.target.checked }))} style={{ display: "none" }} />
            <span style={{ ...Mono, fontSize: 10, color: stockFilter[key] ? "#00e07a" : "rgba(255,255,255,0.6)" }}>{label}</span>
          </label>
        ))}
      </div>

      <button onClick={() => setShowFilters(!showFilters)} style={{ ...Mono, padding: "8px 12px", fontSize: 10, background: G, border: `1px solid ${GB}`, borderRadius: 6, color: "rgba(255,255,255,0.5)", cursor: "pointer", textAlign: "left" }}>
        {showFilters ? "▼ Hide Filters" : "▶ Show Filters"}
      </button>

      {showFilters && (
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <NumField label="Moneyness Min" value={optionFilters.moneynessMin} onChange={(v) => updateOptionFilter("moneynessMin", v)} step="1" />
            <NumField label="Moneyness Max" value={optionFilters.moneynessMax} onChange={(v) => updateOptionFilter("moneynessMax", v)} step="1" />
            <NumField label="Min OI" value={optionFilters.minOpenInterest} onChange={(v) => updateOptionFilter("minOpenInterest", v)} step="1" />
            <NumField label="Max DTE" value={optionFilters.dteMax} onChange={(v) => updateOptionFilter("dteMax", v)} step="1" />
            <NumField label="Min ROI %" value={optionFilters.roiMin} onChange={(v) => updateOptionFilter("roiMin", v)} step="1" />
            <NumField label="Max Delta" value={optionFilters.deltaMax} onChange={(v) => updateOptionFilter("deltaMax", v)} step="0.01" />
          </div>
        </Card>
      )}

      <button onClick={runScreener} disabled={loading} style={{ ...Mono, padding: "14px", fontSize: 13, fontWeight: 600, background: loading ? "rgba(0,224,122,0.3)" : GA, border: `1px solid ${GAB}`, borderRadius: 8, color: "#fff", cursor: loading ? "default" : "pointer" }}>
        {loading ? "Scanning..." : "▶ Run Screener"}
      </button>

      {results.length > 0 && (
        <Card>
          <Lbl>Top {results.length} by ROI</Lbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 350, overflowY: "auto" }}>
            {results.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 6, border: `1px solid ${GB}` }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ ...Mono, fontSize: 13, fontWeight: 700, color: "#00e07a" }}>{r.symbol}</span>
                  <span style={{ ...Mono, fontSize: 9, color: r.type === "cc" ? "#ffcc00" : "#66ccff" }}>{r.type.toUpperCase()} ${r.strike} × {r.dte}d</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span style={{ ...Mono, fontSize: 14, fontWeight: 700, color: "#00e07a" }}>{r.roi}%</span>
                  <span style={{ ...Mono, fontSize: 9, color: "rgba(255,255,255,0.4)" }}>${r.premium} prem</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
