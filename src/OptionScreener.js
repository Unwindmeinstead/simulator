const G = "rgba(255,255,255,0.055)";
const GB = "rgba(255,255,255,0.07)";
const GA = "rgba(0,224,122,0.07)";
const GAB = "rgba(0,224,122,0.22)";

const Mono = { fontFamily: "'JetBrains Mono','IBM Plex Mono',monospace" };

const Lbl = ({ children, c }) => (
  <div style={{ ...Mono, fontSize: 9.5, letterSpacing: "0.13em", textTransform: "uppercase", color: c || "rgba(255,255,255,0.32)", marginBottom: 6 }}>{children}</div>
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
  <div style={{ background: accent ? GA : warn ? "rgba(255,155,0,0.05)" : G, border: `1px solid ${accent ? GAB : warn ? "rgba(255,155,0,0.18)" : GB}`, borderRadius: 10, padding: "14px 16px", ...sx }}>
    {children}
  </div>
);

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ ...Mono, padding: "8px 18px", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", background: active ? GA : "transparent", border: `1px solid ${active ? GAB : GB}`, borderRadius: 8, color: active ? "#00e07a" : "rgba(255,255,255,0.38)", cursor: "pointer", transition: "all 0.15s" }}>
    {label}
  </button>
);

const SelectField = ({ label, value, options, onChange }) => (
  <div>
    <Lbl>{label}</Lbl>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ ...Mono, width: "100%", background: G, border: `1px solid ${GB}`, borderRadius: 7, padding: "9px 10px", color: "#fff", fontSize: 13, outline: "none", cursor: "pointer", appearance: "none" }}>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} style={{ background: "#1a1a2e" }}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const generateMockStocks = (market) => {
  const sp500 = ["AAPL","MSFT","GOOGL","AMZN","NVDA","META","TSLA","BRK.B","UNH","JNJ","V","XOM","JPM","PG","MA","HD","CVX","LLY","ABBV","MRK","AVGO","PEP","COST","KO","WMT","TMO","MCD","CSCO","ACN","ABT","DHR","CRM","NFLX","ADBE","TXN","NKE","NEE","PM","BMY","UNP","RTX","HON","QCOM","LOW","INTC","AMD","IBM","GE","CAT","DE","BLK","INTU","AMGN","GILD","MDLZ","ADI","ISRG","T","BA","SPGI","NOW","BKNG","AXP","AMAT","C","SYK","MMM","TJX","CVS","LRCX","MO","PLD","ADP","MDT","ZTS","SBUX","CME","CB","CI","SO","DUK","NOC","BSX","EL","ITW","APD","EW","MMC","SHW","PFE","CL","COP","ETN","HUM","FCX","EOG","GM","NXPI","KLAC","MU","SNPS","CDNS","AON","CIEN","MSI","PCAR","PH","WM","CMG","BDX","BSY","ADSK","FIS","CBRE","GD","NSC","TT","MAR","TJX","APTV","CMI","ROK","PHM","ORLY","AIG","TRV","PRU","AFL","MET","ALL","SCHW","SPG","O","WELL","AMT","PLD","EQIX","PSA","SPG","O","WELL","AMT","EQIX","PSA","CCI","DLR","AVB","EQR","VTR","WY","ARE","SLG","MAA","KIM","UDR","BXP","PSX","MPC","VLO","PSX","EOG","SLB","HAL","BKR","FANG","DVN","HES","COP","EOG","SLB","FANG","PXD","MPC","VLO","PSX"];
  const stocks = market === "sp500" ? sp500 : [...sp500, "RIVN","LCID","PLTR","SOFI","SNAP","ROKU","ZM","DOCU","CRWD","NET","DDOG","SNOW","SQ","PYPL","HOOD","U","PATH","ABNB","DASH","GPRO","SOS","BTBT","MARA","RIOT","MSTR","COIN","SI","BTC","IBIT","FB","GRMN","ANSS","CDNS","SNPS","KEYS","FSLR","SEDG","ENPH","RUN","SPWR","FSLR","SEDG","ENPH","PLUG","BE","BLNK","CHPT","EVGO","CHSC","QS","ALB","LTHM","SQM","ALB","LTHM","SQM","LAC","PI","CLF","X","MT","NUE","STLD","CMC","RS","AAL","DAL","UAL","LUV","ALK","AAL","DAL","UAL","LUV","SAVE","JBLU","HA","MESA","GOL","AZUL","LUV","DAL","UAL","AAL","ALK","JBLU","SAVE","HA","MESA","EVA","F","GM","TM","HMC","RACE","RIVN","LCID","F","GM","TM","HMC","RACE","RIVN","LCID","TSLA","RIVN","LCID","NIO","XPEV","LI","NIO","XPEV","LI","F","GM","TM","HMC","RACE","RIVN","LCID","TSLA","RIVN","LCID"];
  
  return stocks.slice(0, market === "sp500" ? 50 : 100).map((symbol, idx) => {
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

const generateMockOptions = (stock, strategy, filters) => {
  const sp = parseFloat(stock.price);
  const strikes = [];
  const baseStrike = strategy === "cc" ? sp * (1 + Math.random() * 0.1) : sp * (1 - Math.random() * 0.1);
  
  for (let i = -5; i <= 5; i++) {
    strikes.push(baseStrike * (1 + i * 0.025));
  }
  
  const dteOptions = [7, 14, 21, 30, 45];
  
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
    
    if (optionFilters.dteMin && opt.dte < optionFilters.dteMin) return false;
    if (optionFilters.dteMax && opt.dte > optionFilters.dteMax) return false;
    
    const roi = parseFloat(opt.roi);
    if (optionFilters.roiMin && roi < optionFilters.roiMin) return false;
    if (optionFilters.roiMax && roi > optionFilters.roiMax) return false;
    
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
    dteMin: 0,
    dteMax: 45,
    roiMin: 0,
    roiMax: 100,
    deltaMax: 0.5,
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runScreener = () => {
    setLoading(true);
    setTimeout(() => {
      const stocks = generateMockStocks(market);
      const filteredStocks = filterStocks(stocks, stockFilter);
      
      const allOptions = filteredStocks.flatMap((stock) =>
        generateMockOptions(stock, strategy, optionFilters)
      );
      
      const filteredOptions = filterOptions(allOptions, optionFilters);
      const sorted = filteredOptions
        .sort((a, b) => parseFloat(b.roi) - parseFloat(a.roi))
        .slice(0, 100);
      
      setResults(sorted);
      setLoading(false);
    }, 500);
  };

  const updateOptionFilter = (key, value) => {
    setOptionFilters((prev) => ({ ...prev, [key]: value ? parseFloat(value) : null }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Lbl>Step 1: Select Market</Lbl>
          <div style={{ display: "flex", gap: 8 }}>
            <Pill label="S&P 500" active={market === "sp500"} onClick={() => setMarket("sp500")} />
            <Pill label="Whole Market" active={market === "whole"} onClick={() => setMarket("whole")} />
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Lbl>Step 2: Select Strategy</Lbl>
          <div style={{ display: "flex", gap: 8 }}>
            <Pill label="Cash-Secured Put" active={strategy === "csp"} onClick={() => setStrategy("csp")} />
            <Pill label="Covered Call" active={strategy === "cc"} onClick={() => setStrategy("cc")} />
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Lbl>Step 3: Stock Filter (Moving Averages)</Lbl>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {[
              { key: "priceAboveMa5", label: "Price > MA5" },
              { key: "priceAboveMa10", label: "Price > MA10" },
              { key: "ma5AboveMa10", label: "MA5 > MA10" },
            ].map(({ key, label }) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={stockFilter[key]}
                  onChange={(e) => setStockFilter((prev) => ({ ...prev, [key]: e.target.checked }))}
                  style={{ width: 14, height: 14, accentColor: "#00e07a" }}
                />
                <span style={{ ...Mono, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Lbl>Step 4: Option Filters</Lbl>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <NumField
              label="Moneyness Min %"
              value={optionFilters.moneynessMin}
              onChange={(v) => updateOptionFilter("moneynessMin", v)}
              step="1"
            />
            <NumField
              label="Moneyness Max %"
              value={optionFilters.moneynessMax}
              onChange={(v) => updateOptionFilter("moneynessMax", v)}
              step="1"
            />
            <NumField
              label="Min Open Interest"
              value={optionFilters.minOpenInterest}
              onChange={(v) => updateOptionFilter("minOpenInterest", v)}
              step="1"
            />
            <NumField
              label="Days to Exp (Max)"
              value={optionFilters.dteMax}
              onChange={(v) => updateOptionFilter("dteMax", v)}
              step="1"
            />
            <NumField
              label="ROI Min %"
              value={optionFilters.roiMin}
              onChange={(v) => updateOptionFilter("roiMin", v)}
              step="1"
            />
            <NumField
              label="Delta Max (abs)"
              value={optionFilters.deltaMax}
              onChange={(v) => updateOptionFilter("deltaMax", v)}
              step="0.01"
            />
          </div>
        </div>
      </Card>

      <button
        onClick={runScreener}
        disabled={loading}
        style={{
          ...Mono,
          padding: "14px 24px",
          fontSize: 13,
          fontWeight: 600,
          background: loading ? "rgba(0,224,122,0.3)" : GA,
          border: `1px solid ${GAB}`,
          borderRadius: 8,
          color: "#fff",
          cursor: loading ? "default" : "pointer",
          transition: "all 0.15s",
        }}
      >
        {loading ? "Scanning..." : "Run Screener"}
      </button>

      {results.length > 0 && (
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Lbl>Results - Top {results.length} Contracts by ROI</Lbl>
            </div>
            <div style={{ borderRadius: 8, border: `1px solid ${GB}`, overflow: "auto", maxHeight: 400 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", ...Mono, fontSize: 10 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                    {["Symbol", "Type", "Strike", "Prem", "DTE", "OTM%", "OI", "ROI%", "ROI Assigned", "Delta"].map((h) => (
                      <th key={h} style={{ padding: "8px 6px", textAlign: "right", color: "rgba(255,255,255,0.35)", fontWeight: 500, fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase", borderBottom: `1px solid ${GB}`, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.035)` }}>
                      <td style={{ padding: "8px 6px", textAlign: "right", color: "#00e07a", fontWeight: 600 }}>{r.symbol}</td>
                      <td style={{ padding: "8px 6px", textAlign: "right", color: r.type === "cc" ? "#ffcc00" : "#66ccff" }}>{r.type.toUpperCase()}</td>
                      <td style={{ padding: "8px 6px", textAlign: "right", color: "rgba(255,255,255,0.8)" }}>${r.strike}</td>
                      <td style={{ padding: "8px 6px", textAlign: "right", color: "#00e07a" }}>${r.premium}</td>
                      <td style={{ padding: "8px 6px", textAlign: "right", color: "rgba(255,255,255,0.6)" }}>{r.dte}</td>
                      <td style={{ padding: "8px 6px", textAlign: "right", color: parseFloat(r.otm) >= 0 ? "#00e07a" : "#e05050" }}>{r.otm}%</td>
                      <td style={{ padding: "8px 6px", textAlign: "right", color: "rgba(255,255,255,0.6)" }}>{r.openInterest.toLocaleString()}</td>
                      <td style={{ padding: "8px 6px", textAlign: "right", color: "#00e07a", fontWeight: 600 }}>{r.roi}%</td>
                      <td style={{ padding: "8px 6px", textAlign: "right", color: r.roiAssigned ? "#ffcc00" : "rgba(255,255,255,0.2)" }}>{r.roiAssigned || "—"}</td>
                      <td style={{ padding: "8px 6px", textAlign: "right", color: "rgba(255,255,255,0.5)" }}>{r.delta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
