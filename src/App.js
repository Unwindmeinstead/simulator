import { useState, useEffect } from "react";

const G = "rgba(255,255,255,0.04)";
const GB = "rgba(255,255,255,0.08)";
const GA = "rgba(0,224,122,0.15)";
const GAB = "rgba(0,224,122,0.4)";

const Mono = { fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" };

function calcCC({ stockPrice, strikePrice, premium, dte }) {
  const sp = parseFloat(stockPrice);
  const k = parseFloat(strikePrice);
  const p = parseFloat(premium);
  const d = parseFloat(dte);
  if ([sp, k, p].some((v) => isNaN(v) || v <= 0)) return null;

  const be = sp - p;
  const maxProfit = p + (k - sp);
  const otm = ((k - sp) / sp) * 100;
  const yieldPct = (p / sp) * 100;
  const roiAssigned = (p + (k - sp)) / (sp - p) * 100;
  const annualized = d > 0 ? (p / sp) * (365 / d) * 100 : null;

  return { be, maxProfit, otm, yieldPct, roiAssigned, annualized };
}

function calcCSP({ stockPrice, strikePrice, premium, dte }) {
  const sp = parseFloat(stockPrice);
  const k = parseFloat(strikePrice);
  const p = parseFloat(premium);
  const d = parseFloat(dte);
  if ([sp, k, p].some((v) => isNaN(v) || v <= 0)) return null;

  const be = k - p;
  const otm = ((sp - k) / sp) * 100;
  const yieldPct = (p / k) * 100;
  const roiAssigned = (p - (k - sp)) / (k - p) * 100;
  const annualized = d > 0 ? (p / k) * (365 / d) * 100 : null;

  return { be, otm, yieldPct, roiAssigned, annualized };
}

export default function App() {
  const [tab, setTab] = useState("csp");
  const [f, setF] = useState({ stockPrice: "100", strikePrice: "95", premium: "1.80", dte: "30" });

  const r = tab === "cc" ? calcCC(f) : calcCSP(f);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html, body, #root { min-height: 100%; }
      body { background: #000; -webkit-font-smoothing: antialiased; }
      input, select, button { font-family: inherit; -webkit-appearance: none; }
      input::-webkit-inner-spin-button { -webkit-appearance: none; }
    `;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "'Inter', -apple-system, sans-serif", paddingBottom: 120 }}>
      <div style={{ padding: "60px 20px 24px", maxWidth: 380, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>Options</h1>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Not financial advice</span>
        </div>

        <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 4, marginBottom: 28 }}>
          {[
            { key: "csp", label: "Cash Secured Put" },
            { key: "cc", label: "Covered Call" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1,
                padding: "12px 16px",
                fontSize: 13,
                fontWeight: 600,
                background: tab === key ? "#fff" : "transparent",
                color: tab === key ? "#000" : "rgba(255,255,255,0.5)",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            type="number"
            value={f.stockPrice}
            onChange={(e) => set("stockPrice")(e.target.value)}
            placeholder="Stock Price"
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: "16px",
              color: "#fff",
              fontSize: 32,
              fontWeight: 600,
              textAlign: "center",
              outline: "none",
            }}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Strike</div>
              <input
                type="number"
                value={f.strikePrice}
                onChange={(e) => set("strikePrice")(e.target.value)}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: 22,
                  fontWeight: 600,
                  outline: "none",
                }}
              />
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Premium</div>
              <input
                type="number"
                value={f.premium}
                onChange={(e) => set("premium")(e.target.value)}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  color: "#00e07a",
                  fontSize: 22,
                  fontWeight: 600,
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Days to Expiration</div>
            <input
              type="number"
              value={f.dte}
              onChange={(e) => set("dte")(e.target.value)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "#fff",
                fontSize: 22,
                fontWeight: 600,
                outline: "none",
              }}
            />
          </div>
        </div>

        {r && (
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div style={{ background: "rgba(0,224,122,0.1)", borderRadius: 12, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, textTransform: "uppercase" }}>Yield</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#00e07a" }}>{r.yieldPct.toFixed(2)}%</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, textTransform: "uppercase" }}>Breakeven</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>${r.be.toFixed(2)}</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 16, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, textTransform: "uppercase" }}>OTM</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: r.otm >= 0 ? "#00e07a" : "#ff6b6b" }}>{r.otm >= 0 ? "+" : ""}{r.otm.toFixed(1)}%</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, textTransform: "uppercase" }}>ROI if Assigned</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#00e07a" }}>{r.roiAssigned.toFixed(1)}%</div>
              </div>
              {r.annualized && (
                <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 4, textTransform: "uppercase" }}>Annualized</div>
                  <div style={{ fontSize: 24, fontWeight: 700 }}>{r.annualized.toFixed(0)}%</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
