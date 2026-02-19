import { useState, useEffect } from "react";
import OptionScreener from "./OptionScreener";

/* ══════════════════════════════════════════
   MATH
══════════════════════════════════════════ */
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

  // Scenarios: stock -20%, -10%, 0%, +strike, +10%
  const scenarios = [
    { label: "−20%",  price: sp * 0.80 },
    { label: "−10%",  price: sp * 0.90 },
    { label: "Flat",  price: sp },
    { label: "Strike",price: k },
    { label: "+10%",  price: sp * 1.10 },
  ].map(({ label, price }) => {
    const pl = Math.min(maxProfit, p + (price - sp));
    const plPct = (pl / (sp - p)) * 100;
    return { label, price, pl, plPct };
  });

  let bud2 = null;
  if (!isNaN(bud) && bud > 0) {
    const shares   = Math.floor(bud / sp);
    const ctrs     = Math.floor(shares / 100);
    const used     = ctrs * 100 * sp;
    const premTot  = ctrs * 100 * p;
    bud2 = { ctrs, sharesUsed: ctrs * 100, sharesAffordable: shares, deployed: used,
             leftover: bud - used, premTot, premPerCtr: p * 100, costBasis: be,
             annualizedIncome: annualized != null ? (premTot * (365 / d)) / used * 100 : null };
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
    const plPct = (pl / (k - p)) * 100;
    return { label, price, pl, plPct };
  });

  let bud2 = null;
  if (!isNaN(bud) && bud > 0) {
    const ctrs    = Math.floor(bud / cashPerCtr);
    const used    = ctrs * cashPerCtr;
    const premTot = ctrs * 100 * p;
    bud2 = { ctrs, cashUsed: used, leftover: bud - used, premTot,
             premPerCtr: p * 100, sharesIf: ctrs * 100, costBasis: be,
             annualizedIncome: annualized != null ? (premTot * (365 / d)) / used * 100 : null };
  }

  return { be, cashPerCtr, otm, yieldPct, roiAssigned, annualized, dailyTheta, scenarios, bud: bud2 };
}

/* ══════════════════════════════════════════
   PAYOFF CHART
══════════════════════════════════════════ */
function PayoffChart({ sp, strike, premium, type }) {
  sp = parseFloat(sp); strike = parseFloat(strike); premium = parseFloat(premium);
  if ([sp, strike, premium].some((v) => isNaN(v) || v <= 0)) return null;

  const W = 580, H = 150, pad = { l: 48, r: 12, t: 14, b: 26 };
  const range = sp * 0.5;
  const mn = sp - range, mx = sp + range;
  const py = (s) => type === "cc"
    ? premium + (s - sp) - Math.max(0, s - strike)
    : premium - Math.max(0, strike - s);
  const N = 90;
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
      {/* zero line */}
      <line x1={pad.l} y1={zy} x2={W - pad.r} y2={zy} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
      {/* profit / loss path */}
      <path d={path} fill="none" stroke="#00e07a" strokeWidth={2} clipPath={`url(#u${type})`} />
      <path d={path} fill="none" stroke="#e05050" strokeWidth={2} clipPath={`url(#d${type})`} />
      {/* fill under/over */}
      <path d={`${path} L ${tx(mx)},${zy} L ${tx(mn)},${zy} Z`} fill="rgba(0,224,122,0.06)" clipPath={`url(#u${type})`} />
      <path d={`${path} L ${tx(mx)},${zy} L ${tx(mn)},${zy} Z`} fill="rgba(224,80,80,0.06)" clipPath={`url(#d${type})`} />
      {/* markers */}
      {[
        { v: cl(strike), label: `K ${strike}`, c: "rgba(255,200,60,0.6)" },
        { v: cl(sp),     label: `S ${sp}`,     c: "rgba(255,255,255,0.3)" },
        { v: cl(be),     label: `BE ${be.toFixed(2)}`, c: "rgba(0,224,122,0.55)" },
      ].map(({ v, label, c }, i) => (
        <g key={i}>
          <line x1={tx(v)} y1={pad.t} x2={tx(v)} y2={H - pad.b} stroke={c} strokeWidth={1} strokeDasharray="3,4" />
          <text x={tx(v)} y={H - pad.b + 12} textAnchor="middle" fill={c} fontSize={8.5} fontFamily="'JetBrains Mono',monospace">{label}</text>
        </g>
      ))}
      {/* y labels */}
      {[maxV * 0.75, 0].map((v, i) => (
        <text key={i} x={pad.l - 4} y={ty(v) + 4} textAnchor="end" fill="rgba(255,255,255,0.18)" fontSize={8} fontFamily="'JetBrains Mono',monospace">
          {v >= 0 ? "+" : ""}{v.toFixed(2)}
        </text>
      ))}
    </svg>
  );
}

/* ══════════════════════════════════════════
   UI PRIMITIVES
══════════════════════════════════════════ */
const G = "rgba(255,255,255,0.055)";     // glass bg
const GB = "rgba(255,255,255,0.07)";     // glass border
const GA = "rgba(0,224,122,0.07)";       // accent bg
const GAB = "rgba(0,224,122,0.22)";      // accent border

const Mono = { fontFamily: "'JetBrains Mono','IBM Plex Mono',monospace" };

const Pill = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{ ...Mono, padding: "8px 18px", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", background: active ? GA : "transparent", border: `1px solid ${active ? GAB : GB}`, borderRadius: 8, color: active ? "#00e07a" : "rgba(255,255,255,0.38)", cursor: "pointer", transition: "all 0.15s" }}>
    {label}
  </button>
);

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

const KV = ({ k, v, sub, accent, warn, big }) => (
  <Card accent={accent} warn={warn}>
    <Lbl>{k}</Lbl>
    <div style={{ ...Mono, fontSize: big ? 24 : 18, fontWeight: 700, color: accent ? "#00e07a" : warn ? "#ffaa33" : "#e8e8e8", lineHeight: 1.2 }}>{v}</div>
    {sub && <div style={{ ...Mono, fontSize: 9.5, color: "rgba(255,255,255,0.25)", marginTop: 3 }}>{sub}</div>}
  </Card>
);

const Sep = ({ label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{ flex: 1, height: 1, background: GB }} />
    {label && <Lbl style={{ margin: 0 }}>{label}</Lbl>}
    <div style={{ flex: 1, height: 1, background: GB }} />
  </div>
);

const Badge = ({ label, value, pos }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: pos ? "rgba(0,224,122,0.06)" : "rgba(224,80,80,0.06)", border: `1px solid ${pos ? "rgba(0,224,122,0.18)" : "rgba(224,80,80,0.18)"}`, borderRadius: 8, padding: "9px 13px" }}>
    <Lbl c="rgba(255,255,255,0.35)">{label}</Lbl>
    <span style={{ ...Mono, fontSize: 13, fontWeight: 700, color: pos ? "#00e07a" : "#e05050" }}>{value}</span>
  </div>
);

/* ══════════════════════════════════════════
   SCENARIO TABLE
══════════════════════════════════════════ */
function ScenarioTable({ scenarios, costBasis }) {
  return (
    <div>
      <Lbl>Scenarios at Expiration</Lbl>
      <div style={{ borderRadius: 8, border: `1px solid ${GB}`, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", ...Mono, fontSize: 11 }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.03)" }}>
              {["Scenario", "Price", "P&L / Share", "P&L %"].map((h) => (
                <th key={h} style={{ padding: "7px 10px", textAlign: "right", color: "rgba(255,255,255,0.25)", fontWeight: 500, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: `1px solid ${GB}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scenarios.map(({ label, price, pl, plPct }) => {
              const pos = pl >= 0;
              return (
                <tr key={label} style={{ borderBottom: `1px solid rgba(255,255,255,0.035)` }}>
                  <td style={{ padding: "7px 10px", textAlign: "right", color: "rgba(255,255,255,0.5)", fontSize: 10 }}>{label}</td>
                  <td style={{ padding: "7px 10px", textAlign: "right", color: "rgba(255,255,255,0.7)" }}>${price.toFixed(2)}</td>
                  <td style={{ padding: "7px 10px", textAlign: "right", color: pos ? "#00e07a" : "#e05050", fontWeight: 600 }}>{pos ? "+" : ""}${pl.toFixed(2)}</td>
                  <td style={{ padding: "7px 10px", textAlign: "right", color: pos ? "rgba(0,224,122,0.6)" : "rgba(224,80,80,0.6)" }}>{pos ? "+" : ""}{plPct.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PANELS
══════════════════════════════════════════ */
function CCPanel() {
  const [f, setF] = useState({ stockPrice: "100", strikePrice: "105", premium: "2.50", dte: "30", budget: "" });
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const r = calcCC(f);
  const sp = parseFloat(f.stockPrice) || 0;
  const k  = parseFloat(f.strikePrice) || 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16, alignItems: "start" }}>
      {/* ── Left: inputs ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, background: G, border: `1px solid ${GB}`, borderRadius: 12, padding: 18 }}>
        <NumField label="Stock Price"   value={f.stockPrice} onChange={set("stockPrice")} pre="$" />
        <NumField label="Call Strike"   value={f.strikePrice} onChange={set("strikePrice")} pre="$" />
        <NumField label="Premium (mid)" value={f.premium}    onChange={set("premium")} pre="$" note="Bid/ask midpoint" />
        <NumField label="Days to Exp"   value={f.dte}        onChange={set("dte")} suf="DTE" step="1" ph="e.g. 30" />
        <Sep />
        <NumField label="Budget"        value={f.budget}     onChange={set("budget")} pre="$" ph="optional" />

        {r && (
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 4 }}>
            <Badge label={r.otm >= 0 ? "OTM" : "ITM"} value={(r.otm >= 0 ? "+" : "") + r.otm.toFixed(2) + "%"} pos={r.otm >= 0} />
            <Badge label="Yield" value={r.yieldPct.toFixed(2) + "% / period"} pos />
            {r.annualized != null && <Badge label="Ann. Yield" value={r.annualized.toFixed(1) + "%"} pos />}
          </div>
        )}
      </div>

      {/* ── Right: results ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {r ? (
          <>
            {/* Core metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <KV k="Premium / Share"  v={`$${parseFloat(f.premium).toFixed(2)}`} accent big />
              <KV k="Breakeven"        v={`$${r.be.toFixed(2)}`}   sub={`${r.prot.toFixed(2)}% downside buffer`} />
              <KV k="Max Profit"       v={`$${r.maxProfit.toFixed(2)}`} sub="per share at expiry" />
              <KV k="ROI if Assigned"  v={r.roiAssigned != null ? r.roiAssigned.toFixed(2) + "%" : "—"} accent />
              {r.annualized != null && <KV k="Annualized Yield" v={r.annualized.toFixed(2) + "%"} accent />}
              {r.dailyTheta != null && <KV k="Daily Theta Est." v={"$" + r.dailyTheta.toFixed(3)} sub="premium decay/day" />}
            </div>

            {/* Budget */}
            {r.bud && (
              <>
                <Sep label="Budget Allocation" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <KV k="Contracts"         v={r.bud.ctrs}                              accent big />
                  <KV k="Shares"            v={r.bud.sharesUsed.toLocaleString()}        sub={`${r.bud.sharesAffordable} affordable`} />
                  <KV k="Cash Leftover"     v={`$${r.bud.leftover.toFixed(0)}`}          warn={r.bud.leftover > 0} />
                  <KV k="Capital Deployed"  v={`$${r.bud.deployed.toLocaleString(undefined,{maximumFractionDigits:0})}`} sub="stock purchase" />
                  <KV k="Premium Income"    v={`$${r.bud.premTot.toFixed(0)}`}           accent sub={`$${r.bud.premPerCtr.toFixed(2)} / contract`} />
                  <KV k="Cost Basis"        v={`$${r.bud.costBasis.toFixed(2)}`}         sub="per share after premium" />
                  {r.bud.annualizedIncome != null && (
                    <KV k="Ann. Income on Capital" v={r.bud.annualizedIncome.toFixed(2) + "%"} accent />
                  )}
                </div>
              </>
            )}

            {/* Scenarios */}
            <ScenarioTable scenarios={r.scenarios} costBasis={r.be} />

            {/* Payoff chart */}
            <Card style={{ padding: "16px 18px" }}>
              <Lbl>Payoff at Expiration · per share</Lbl>
              <div style={{ marginTop: 8 }}>
                <PayoffChart sp={f.stockPrice} strike={f.strikePrice} premium={f.premium} type="cc" />
              </div>
            </Card>
          </>
        ) : (
          <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120 }}>
            <span style={{ ...Mono, fontSize: 12, color: "rgba(255,255,255,0.18)" }}>Enter stock price, strike, and premium</span>
          </Card>
        )}
      </div>
    </div>
  );
}

function CSPPanel() {
  const [f, setF] = useState({ stockPrice: "100", strikePrice: "95", premium: "1.80", dte: "30", budget: "" });
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const r = calcCSP(f);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16, alignItems: "start" }}>
      {/* ── Left: inputs ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, background: G, border: `1px solid ${GB}`, borderRadius: 12, padding: 18 }}>
        <NumField label="Stock Price"    value={f.stockPrice}  onChange={set("stockPrice")} pre="$" />
        <NumField label="Put Strike"     value={f.strikePrice} onChange={set("strikePrice")} pre="$" />
        <NumField label="Premium (mid)"  value={f.premium}     onChange={set("premium")} pre="$" note="Bid/ask midpoint" />
        <NumField label="Days to Exp"    value={f.dte}         onChange={set("dte")} suf="DTE" step="1" ph="e.g. 30" />
        <Sep />
        <NumField label="Budget"         value={f.budget}      onChange={set("budget")} pre="$" ph="optional" />

        {r && (
          <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 4 }}>
            <Badge label={r.otm >= 0 ? "OTM put" : "ITM put"} value={(r.otm >= 0 ? "+" : "") + r.otm.toFixed(2) + "%"} pos={r.otm >= 0} />
            <Badge label="Yield on Cash" value={r.yieldPct.toFixed(2) + "% / period"} pos />
            {r.annualized != null && <Badge label="Ann. Yield" value={r.annualized.toFixed(1) + "%"} pos />}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: G, border: `1px solid ${GB}`, borderRadius: 8, padding: "9px 13px" }}>
              <Lbl c="rgba(255,255,255,0.35)">Cash / contract</Lbl>
              <span style={{ ...Mono, fontSize: 13, fontWeight: 700, color: "#e8e8e8" }}>${r.cashPerCtr.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Right: results ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {r ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <KV k="Premium / Share"  v={`$${parseFloat(f.premium).toFixed(2)}`} accent big />
              <KV k="Breakeven"        v={`$${r.be.toFixed(2)}`}   sub="effective buy price if assigned" />
              <KV k="ROI if Assigned"  v={r.roiAssigned != null ? r.roiAssigned.toFixed(2) + "%" : "—"} />
              <KV k="Yield on Cash"    v={r.yieldPct.toFixed(3) + "%"} accent />
              {r.annualized != null && <KV k="Annualized Yield" v={r.annualized.toFixed(2) + "%"} accent />}
              {r.dailyTheta != null && <KV k="Daily Theta Est." v={"$" + r.dailyTheta.toFixed(3)} sub="premium decay/day" />}
            </div>

            {/* Budget */}
            {r.bud && (
              <>
                <Sep label="Budget Allocation" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <KV k="Contracts"         v={r.bud.ctrs}                              accent big />
                  <KV k="Cash Secured"      v={`$${r.bud.cashUsed.toLocaleString(undefined,{maximumFractionDigits:0})}`} sub="tied as collateral" />
                  <KV k="Cash Leftover"     v={`$${r.bud.leftover.toFixed(0)}`}          warn={r.bud.leftover > 0} />
                  <KV k="Premium Income"    v={`$${r.bud.premTot.toFixed(0)}`}           accent sub={`$${r.bud.premPerCtr.toFixed(2)} / contract`} />
                  <KV k="If Assigned"       v={`${r.bud.sharesIf.toLocaleString()} sh`} sub={`@ $${r.bud.costBasis.toFixed(2)} basis`} />
                  {r.bud.annualizedIncome != null && (
                    <KV k="Ann. Income on Cash" v={r.bud.annualizedIncome.toFixed(2) + "%"} accent />
                  )}
                </div>
              </>
            )}

            <ScenarioTable scenarios={r.scenarios} costBasis={r.be} />

            <Card style={{ padding: "16px 18px" }}>
              <Lbl>Payoff at Expiration · per share</Lbl>
              <div style={{ marginTop: 8 }}>
                <PayoffChart sp={f.stockPrice} strike={f.strikePrice} premium={f.premium} type="csp" />
              </div>
            </Card>
          </>
        ) : (
          <Card style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120 }}>
            <span style={{ ...Mono, fontSize: 12, color: "rgba(255,255,255,0.18)" }}>Enter stock price, strike, and premium</span>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   APP
══════════════════════════════════════════ */
export default function App() {
  const [tab, setTab] = useState("cc");

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #08090b; }
      input[type=number]::-webkit-inner-spin-button,
      input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
      input[type=number] { -moz-appearance: textfield; }
      input::placeholder { color: rgba(255,255,255,0.14); }
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
    `;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#08090b", padding: "28px 24px", color: "#e8e8e8", fontFamily: "'JetBrains Mono', monospace" }}>
      {/* very subtle radial bg */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "70vw", height: "35vh", background: "radial-gradient(ellipse at 50% -10%, rgba(0,200,100,0.045) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative" }}>

        {/* ── Tab bar — the only "header" ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 22, borderBottom: `1px solid ${GB}`, paddingBottom: 16 }}>
          <Pill label="Covered Call"     active={tab === "cc"}  onClick={() => setTab("cc")} />
          <Pill label="Cash Secured Put" active={tab === "csp"} onClick={() => setTab("csp")} />
          <Pill label="Option Screener"  active={tab === "screener"} onClick={() => setTab("screener")} />
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>
            Not financial advice
          </span>
        </div>

        {/* ── Panels ── */}
        {tab === "cc"  && <CCPanel />}
        {tab === "csp" && <CSPPanel />}
        {tab === "screener" && <OptionScreener />}
      </div>
    </div>
  );
}
