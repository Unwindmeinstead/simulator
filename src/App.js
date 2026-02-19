import { useState, useEffect } from "react";
import OptionScreener from "./OptionScreener";

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
  <button onClick={onClick} style={{ ...Mono, padding: "10px 16px", fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", background: active ? GA : "transparent", border: `1px solid ${active ? GAB : GB}`, borderRadius: 8, color: active ? "#00e07a" : "rgba(255,255,255,0.38)", cursor: "pointer", transition: "all 0.15s", flex: 1, textAlign: "center" }}>
    {label}
  </button>
);

const Badge = ({ label, value, pos }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: pos ? "rgba(0,224,122,0.06)" : "rgba(224,80,80,0.06)", border: `1px solid ${pos ? "rgba(0,224,122,0.18)" : "rgba(224,80,80,0.18)"}`, borderRadius: 8, padding: "9px 13px" }}>
    <Lbl c="rgba(255,255,255,0.35)">{label}</Lbl>
    <span style={{ ...Mono, fontSize: 13, fontWeight: 700, color: pos ? "#00e07a" : "#e05050" }}>{value}</span>
  </div>
);

const Sep = ({ label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{ flex: 1, height: 1, background: GB }} />
    {label && <Lbl style={{ margin: 0 }}>{label}</Lbl>}
    <div style={{ flex: 1, height: 1, background: GB }} />
  </div>
);

function PayoffChart({ sp, strike, premium, type }) {
  sp = parseFloat(sp); strike = parseFloat(strike); premium = parseFloat(premium);
  if ([sp, strike, premium].some((v) => isNaN(v) || v <= 0)) return null;

  const W = 320, H = 140, pad = { l: 40, r: 8, t: 12, b: 24 };
  const range = sp * 0.5;
  const mn = sp - range, mx = sp + range;
  const py = (s) => type === "cc"
    ? premium + (s - sp) - Math.max(0, s - strike)
    : premium - Math.max(0, strike - s);
  const N = 60;
  const vArr = Array.from({ length: N }, (_, i) => py(mn + (i / (N - 1)) * (mx - mn)));
  const minV = Math.min(...vArr) * 1.3, maxV = Math.max(...vArr) * 1.3;
  const tx = (s) => pad.l + ((s - mn) / (mx - mn)) * (W - pad.l - pad.r);
  const ty = (v) => pad.t + (1 - (v - minV) / (maxV - minV)) * (H - pad.t - pad.b);
  const pts = Array.from({ length: N }, (_, i) => { const s = mn + (i / (N - 1)) * (mx - mn); return `${tx(s)},${ty(py(s))}`; }).join(" L ");
  const path = `M ${pts}`;
  const zy = ty(0);
  const be = type === "cc" ? sp - premium : strike - premium;
  const cl = (v) => Math.max(mn + 1, Math.min(mx - 1, v));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <clipPath id={`u${type}`}><rect x={pad.l} y={pad.t} width={W - pad.l - pad.r} height={Math.max(0, zy - pad.t)} /></clipPath>
        <clipPath id={`d${type}`}><rect x={pad.l} y={zy} width={W - pad.l - pad.r} height={Math.max(0, H - pad.b - zy)} /></clipPath>
      </defs>
      <line x1={pad.l} y1={zy} x2={W - pad.r} y2={zy} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
      <path d={path} fill="none" stroke="#00e07a" strokeWidth={2} clipPath={`url(#u${type})`} />
      <path d={path} fill="none" stroke="#e05050" strokeWidth={2} clipPath={`url(#d${type})`} />
      <path d={`${path} L ${tx(mx)},${zy} L ${tx(mn)},${zy} Z`} fill="rgba(0,224,122,0.06)" clipPath={`url(#u${type})`} />
      <path d={`${path} L ${tx(mx)},${zy} L ${tx(mn)},${zy} Z`} fill="rgba(224,80,80,0.06)" clipPath={`url(#d${type})`} />
      {[
        { v: cl(strike), label: `K ${strike}`, c: "rgba(255,200,60,0.6)" },
        { v: cl(be), label: `BE`, c: "rgba(0,224,122,0.55)" },
      ].map(({ v, label, c }, i) => (
        <g key={i}>
          <line x1={tx(v)} y1={pad.t} x2={tx(v)} y2={H - pad.b} stroke={c} strokeWidth={1} strokeDasharray="3,4" />
          <text x={tx(v)} y={H - pad.b + 10} textAnchor="middle" fill={c} fontSize={8} fontFamily="'JetBrains Mono',monospace">{label}</text>
        </g>
      ))}
    </svg>
  );
}

function ScenarioTable({ scenarios }) {
  return (
    <div>
      <Lbl>Scenarios at Expiration</Lbl>
      <div style={{ borderRadius: 8, border: `1px solid ${GB}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", ...Mono, fontSize: 10 }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              {["Scenario", "Price", "P&L"].map((h) => (
                <th key={h} style={{ padding: "6px 8px", textAlign: "right", color: "rgba(255,255,255,0.25)", fontWeight: 500, fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: `1px solid ${GB}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scenarios.map(({ label, price, pl }) => {
              const pos = pl >= 0;
              return (
                <tr key={label} style={{ borderBottom: `1px solid rgba(255,255,255,0.035)` }}>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: "rgba(255,255,255,0.5)", fontSize: 9 }}>{label}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: "rgba(255,255,255,0.7)" }}>${price.toFixed(2)}</td>
                  <td style={{ padding: "6px 8px", textAlign: "right", color: pos ? "#00e07a" : "#e05050", fontWeight: 600 }}>{pos ? "+" : ""}${pl.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function calcCC({ stockPrice, strikePrice, premium, dte, budget }) {
  const sp  = parseFloat(stockPrice);
  const k   = parseFloat(strikePrice);
  const p   = parseFloat(premium);
  const d   = parseFloat(dte);
  const bud = parseFloat(budget);
  if ([sp, k, p].some((v) => isNaN(v) || v <= 0)) return null;

  const be      = sp - p;
  const maxProfit = p + (k - sp);
  const prot    = (p / sp) * 100;
  const otm     = ((k - sp) / sp) * 100;
  const yieldPct = (p / sp) * 100;
  const denom   = sp - p;
  const roiAssigned = denom !== 0 ? ((p + (k - sp)) / denom) * 100 : null;
  const annualized  = !isNaN(d) && d > 0 ? (p / sp) * (365 / d) * 100 : null;
  const dailyTheta  = !isNaN(d) && d > 0 ? p / d : null;

  const scenarios = [
    { label: "−20%",  price: sp * 0.80 },
    { label: "−10%",  price: sp * 0.90 },
    { label: "Flat",  price: sp },
    { label: "Strike",price: k },
    { label: "+10%",  price: sp * 1.10 },
  ].map(({ label, price }) => {
    const pl = Math.min(maxProfit, p + (price - sp));
    return { label, price, pl };
  });

  let bud2 = null;
  if (!isNaN(bud) && bud > 0) {
    const shares   = Math.floor(bud / sp);
    const ctrs     = Math.floor(shares / 100);
    const used     = ctrs * 100 * sp;
    const premTot  = ctrs * 100 * p;
    bud2 = { ctrs, sharesUsed: ctrs * 100, sharesAffordable: shares, deployed: used,
             leftover: bud - used, premTot, premPerCtr: p * 100, costBasis: be };
  }

  return { be, maxProfit, prot, otm, yieldPct, roiAssigned, annualized, dailyTheta, scenarios, bud: bud2 };
}

function calcCSP({ stockPrice, strikePrice, premium, dte, budget }) {
  const sp  = parseFloat(stockPrice);
  const k   = parseFloat(strikePrice);
  const p   = parseFloat(premium);
  const d   = parseFloat(dte);
  const bud = parseFloat(budget);
  if ([sp, k, p].some((v) => isNaN(v) || v <= 0)) return null;

  const be          = k - p;
  const cashPerCtr  = k * 100;
  const otm         = ((sp - k) / sp) * 100;
  const yieldPct    = (p / k) * 100;
  const denom       = k - p;
  const roiAssigned = denom !== 0 ? ((p - (k - sp)) / denom) * 100 : null;
  const annualized  = !isNaN(d) && d > 0 ? (p / k) * (365 / d) * 100 : null;
  const dailyTheta  = !isNaN(d) && d > 0 ? p / d : null;

  const scenarios = [
    { label: "−20%",  price: sp * 0.80 },
    { label: "−10%",  price: sp * 0.90 },
    { label: "Strike",price: k },
    { label: "Flat",  price: sp },
    { label: "+10%",  price: sp * 1.10 },
  ].map(({ label, price }) => {
    const pl    = p - Math.max(0, k - price);
    return { label, price, pl };
  });

  let bud2 = null;
  if (!isNaN(bud) && bud > 0) {
    const ctrs    = Math.floor(bud / cashPerCtr);
    const used    = ctrs * cashPerCtr;
    const premTot = ctrs * 100 * p;
    bud2 = { ctrs, cashUsed: used, leftover: bud - used, premTot,
             premPerCtr: p * 100, sharesIf: ctrs * 100, costBasis: be };
  }

  return { be, cashPerCtr, otm, yieldPct, roiAssigned, annualized, dailyTheta, scenarios, bud: bud2 };
}

function CCPanel() {
  const [f, setF] = useState({ stockPrice: "100", strikePrice: "105", premium: "2.50", dte: "30", budget: "" });
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const r = calcCC(f);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <NumField label="Stock Price"   value={f.stockPrice} onChange={set("stockPrice")} pre="$" />
        <NumField label="Call Strike"  value={f.strikePrice} onChange={set("strikePrice")} pre="$" />
        <NumField label="Premium"       value={f.premium}    onChange={set("premium")} pre="$" />
        <NumField label="Days to Exp"  value={f.dte}        onChange={set("dte")} suf="DTE" step="1" />
        <NumField label="Budget"        value={f.budget}     onChange={set("budget")} pre="$" ph="optional" />
      </div>

      {r && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Card accent>
              <div style={{ ...Mono, fontSize: 9, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>Premium</div>
              <div style={{ ...Mono, fontSize: 22, fontWeight: 700, color: "#00e07a" }}>${parseFloat(f.premium).toFixed(2)}</div>
            </Card>
            <Card>
              <div style={{ ...Mono, fontSize: 9, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>Breakeven</div>
              <div style={{ ...Mono, fontSize: 22, fontWeight: 700, color: "#e8e8e8" }}>${r.be.toFixed(2)}</div>
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Badge label={r.otm >= 0 ? "OTM" : "ITM"} value={(r.otm >= 0 ? "+" : "") + r.otm.toFixed(1) + "%"} pos={r.otm >= 0} />
            <Badge label="Yield" value={r.yieldPct.toFixed(2) + "%"} pos />
          </div>

          {r.roiAssigned != null && (
            <Card accent>
              <div style={{ ...Mono, fontSize: 9, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>ROI if Assigned</div>
              <div style={{ ...Mono, fontSize: 18, fontWeight: 700, color: "#00e07a" }}>{r.roiAssigned.toFixed(2)}%</div>
            </Card>
          )}

          {r.bud && (
            <>
              <Sep label="Budget" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Card accent>
                  <div style={{ ...Mono, fontSize: 9, color: "rgba(255,255,255,0.35)" }}>Contracts</div>
                  <div style={{ ...Mono, fontSize: 18, fontWeight: 700, color: "#00e07a" }}>{r.bud.ctrs}</div>
                </Card>
                <Card>
                  <div style={{ ...Mono, fontSize: 9, color: "rgba(255,255,255,0.35)" }}>Income</div>
                  <div style={{ ...Mono, fontSize: 18, fontWeight: 700, color: "#e8e8e8" }}>${r.bud.premTot.toFixed(0)}</div>
                </Card>
              </div>
            </>
          )}

          <ScenarioTable scenarios={r.scenarios} />

          <Card style={{ padding: "12px 14px" }}>
            <Lbl>Payoff at Expiration</Lbl>
            <PayoffChart sp={f.stockPrice} strike={f.strikePrice} premium={f.premium} type="cc" />
          </Card>
        </div>
      )}
    </div>
  );
}

function CSPPanel() {
  const [f, setF] = useState({ stockPrice: "100", strikePrice: "95", premium: "1.80", dte: "30", budget: "" });
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const r = calcCSP(f);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <NumField label="Stock Price"   value={f.stockPrice} onChange={set("stockPrice")} pre="$" />
        <NumField label="Put Strike"    value={f.strikePrice} onChange={set("strikePrice")} pre="$" />
        <NumField label="Premium"        value={f.premium}    onChange={set("premium")} pre="$" />
        <NumField label="Days to Exp"    value={f.dte}        onChange={set("dte")} suf="DTE" step="1" />
        <NumField label="Budget"         value={f.budget}     onChange={set("budget")} pre="$" ph="optional" />
      </div>

      {r && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Card accent>
              <div style={{ ...Mono, fontSize: 9, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>Premium</div>
              <div style={{ ...Mono, fontSize: 22, fontWeight: 700, color: "#00e07a" }}>${parseFloat(f.premium).toFixed(2)}</div>
            </Card>
            <Card>
              <div style={{ ...Mono, fontSize: 9, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>Breakeven</div>
              <div style={{ ...Mono, fontSize: 22, fontWeight: 700, color: "#e8e8e8" }}>${r.be.toFixed(2)}</div>
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Badge label={r.otm >= 0 ? "OTM" : "ITM"} value={(r.otm >= 0 ? "+" : "") + r.otm.toFixed(1) + "%"} pos={r.otm >= 0} />
            <Badge label="Yield" value={r.yieldPct.toFixed(2) + "%"} pos />
          </div>

          {r.roiAssigned != null && (
            <Card accent>
              <div style={{ ...Mono, fontSize: 9, color: "rgba(255,255,255,0.35)", marginBottom: 2 }}>ROI if Assigned</div>
              <div style={{ ...Mono, fontSize: 18, fontWeight: 700, color: "#00e07a" }}>{r.roiAssigned.toFixed(2)}%</div>
            </Card>
          )}

          {r.bud && (
            <>
              <Sep label="Budget" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Card accent>
                  <div style={{ ...Mono, fontSize: 9, color: "rgba(255,255,255,0.35)" }}>Contracts</div>
                  <div style={{ ...Mono, fontSize: 18, fontWeight: 700, color: "#00e07a" }}>{r.bud.ctrs}</div>
                </Card>
                <Card>
                  <div style={{ ...Mono, fontSize: 9, color: "rgba(255,255,255,0.35)" }}>Income</div>
                  <div style={{ ...Mono, fontSize: 18, fontWeight: 700, color: "#e8e8e8" }}>${r.bud.premTot.toFixed(0)}</div>
                </Card>
              </div>
            </>
          )}

          <ScenarioTable scenarios={r.scenarios} />

          <Card style={{ padding: "12px 14px" }}>
            <Lbl>Payoff at Expiration</Lbl>
            <PayoffChart sp={f.stockPrice} strike={f.strikePrice} premium={f.premium} type="csp" />
          </Card>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("cc");

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body, #root { min-height: 100%; }
      body { background: #08090b; touch-action: manipulation; }
      input[type=number]::-webkit-inner-spin-button,
      input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
      input[type=number] { -moz-appearance: textfield; }
      input::placeholder { color: rgba(255,255,255,0.14); }
      select { -webkit-appearance: none; border-radius: 7px; }
      button { -webkit-tap-highlight-color: transparent; }
    `;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#08090b", padding: "16px 14px 100px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace" }}>
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "90vw", height: "30vh", background: "radial-gradient(ellipse at 50% -10%, rgba(0,200,100,0.045) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ marginBottom: 16 }}>
        <h1 style={{ ...Mono, fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 12 }}>Options Sim</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Pill label="CC" active={tab === "cc"} onClick={() => setTab("cc")} />
          <Pill label="CSP" active={tab === "csp"} onClick={() => setTab("csp")} />
          <Pill label="Screener" active={tab === "screener"} onClick={() => setTab("screener")} />
        </div>
      </div>

      {tab === "cc"  && <CCPanel />}
      {tab === "csp" && <CSPPanel />}
      {tab === "screener" && <OptionScreener />}

      <div style={{ position: "fixed", bottom: 20, left: 14, right: 14, textAlign: "center" }}>
        <span style={{ ...Mono, fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.12)" }}>
          Not financial advice
        </span>
      </div>
    </div>
  );
}
