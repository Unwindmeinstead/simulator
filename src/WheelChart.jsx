import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const TIMEFRAMES = [
  { label: "5m", full: "5 Minutes" },
  { label: "15m", full: "15 Minutes" },
  { label: "30m", full: "30 Minutes" },
  { label: "1H", full: "1 Hour" },
  { label: "4H", full: "4 Hours" },
  { label: "1D", full: "Today" },
  { label: "1W", full: "1 Week" },
  { label: "1M", full: "1 Month" },
  { label: "3M", full: "3 Months" },
  { label: "1Y", full: "1 Year" },
  { label: "5Y", full: "5 Years" },
  { label: "ALL", full: "All Time" },
];

const EMA_PRESETS = [
  { label: "EMA 9", period: 9, color: "#f59e0b" },
  { label: "EMA 20", period: 20, color: "#06b6d4" },
  { label: "EMA 50", period: 50, color: "#8b5cf6" },
  { label: "EMA 200", period: 200, color: "#ec4899" },
  { label: "SMA 50", period: 50, color: "#22c55e", isSMA: true },
  { label: "SMA 200", period: 200, color: "#ef4444", isSMA: true },
];

function downsample(arr, n) {
  if (!arr || arr.length <= n) return arr || [];
  const result = [];
  const step = arr.length / n;
  for (let i = 0; i < n; i++) {
    result.push(arr[Math.floor(i * step)]);
  }
  result.push(arr[arr.length - 1]);
  return result;
}

function calculateEMA(data, period) {
  if (!data || data.length < period) return [];
  const k = 2 / (period + 1);
  const ema = [];
  let prevEMA = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = 0; i < period - 1; i++) ema.push(null);
  ema.push(prevEMA);
  for (let i = period; i < data.length; i++) {
    const newEMA = data[i] * k + prevEMA * (1 - k);
    ema.push(newEMA);
    prevEMA = newEMA;
  }
  return ema;
}

function calculateSMA(data, period) {
  if (!data || data.length < period) return [];
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

import PlugChart from "./PlugChart";

export default function WheelChart({ chartData, isPositive, price, change, changePct, chartRange, setChartRange, ticker = "AAPL" }) {
  const containerRef = useRef(null);
  const [dims, setDims] = useState({ w: 600, h: 280 });
  const [hoverData, setHoverData] = useState([]);
  const [emaSettings, setEmaSettings] = useState([{ period: 9, color: "#f59e0b", enabled: true }]);

  const prices = useMemo(() => {
    const arr = chartData?.map(d => d.close).filter(Boolean) || [];
    return downsample(arr, 600);
  }, [chartData]);

  const displayPrice = hoverData?.[0]?.price ?? price ?? 0;
  const displayChange = displayPrice - (prices[0] || price || 0);
  const displayChangePct = prices[0] ? (displayChange / prices[0]) * 100 : 0;
  const isUp = displayChange >= 0;

  const emaLines = useMemo(() => {
    return emaSettings.filter(e => e.enabled).map(setting => {
      const data = setting.isSMA 
        ? calculateSMA(prices, setting.period)
        : calculateEMA(prices, setting.period);
      return {
        data,
        color: setting.color,
        label: setting.label,
      };
    });
  }, [prices, emaSettings]);

  const toggleEma = (period, color, isSMA) => {
    setEmaSettings(prev => {
      const exists = prev.find(e => e.period === period && e.isSMA === isSMA);
      if (exists) {
        return prev.filter(e => e.period !== period || e.isSMA !== isSMA);
      }
      return [...prev, { period, color, enabled: true, isSMA }];
    });
  };

  useEffect(() => {
    if (!containerRef.current) {
      const timer = setTimeout(() => {
        setDims({ w: 700, h: 320 });
      }, 100);
      return () => clearTimeout(timer);
    }
    
    const ro = new ResizeObserver(entries => {
      if (!entries[0]) return;
      const w = Math.floor(entries[0].contentRect.width);
      const h = Math.min(420, Math.max(280, Math.floor(w * 0.45)));
      setDims({ w, h });
    });
    
    try {
      ro.observe(containerRef.current);
    } catch (e) {
      setDims({ w: 700, h: 340 });
    }
    return () => ro.disconnect();
  }, []);

  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (chartData?.length > 0) {
      setLoading(false);
    } else if (chartData) {
      const timer = setTimeout(() => setLoading(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [chartData]);
  
  const hasData = prices.length > 0;
  
  const chartHeight = 380;
  
  if (!hasData && loading) {
    return (
      <div ref={containerRef} style={{ width: '100%', height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', background: 'rgba(10,10,12,0.9)', borderRadius: 14 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Loading chart...</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>{ticker}</div>
        </div>
      </div>
    );
  }
  
  if (!hasData) {
    return (
      <div ref={containerRef} style={{ width: '100%', height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', background: 'rgba(10,10,12,0.9)', borderRadius: 14 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>No chart data</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>{ticker}</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', position: 'relative' }}>
      <style>{`
        .tf-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.4);
          font-size: 12px;
          font-weight: 500;
          font-family: inherit;
          padding: 5px 10px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .tf-btn:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.06); }
        .tf-btn.active { color: #fff; background: rgba(255,255,255,0.1); }
        .ema-btn {
          background: transparent;
          border: 1px solid;
          font-size: 11px;
          font-weight: 500;
          font-family: 'DM Mono', monospace;
          padding: 4px 10px;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.15s ease;
          opacity: 0.7;
        }
        .ema-btn:hover { opacity: 1; }
        .ema-btn.active { opacity: 1; }
      `}</style>
      
      {/* Stock Info Overlay - Top Left */}
      <div style={{ 
        position: 'absolute', 
        top: -2, 
        left: 12, 
        zIndex: 10,
        pointerEvents: 'none'
      }}>
        <div style={{ 
          fontSize: 12, 
          fontWeight: 600, 
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.08em',
          marginBottom: 1,
          textTransform: 'uppercase'
        }}>
          {ticker}
        </div>
        <div style={{ 
          fontSize: 36, 
          fontWeight: 700, 
          fontFamily: "'DM Mono', monospace",
          letterSpacing: '-0.02em',
          color: '#ffffff',
          lineHeight: 1.1,
          textShadow: '0 0 20px rgba(255,255,255,0.3)',
        }}>

          ${displayPrice?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          marginTop: 6
        }}>
          <span style={{
            color: isUp ? "#00ff88" : "#ff5050",
            fontSize: 14,
            fontFamily: "'DM Mono', monospace",
            fontWeight: 600,
            textShadow: isUp ? '0 0 10px rgba(0,255,136,0.4)' : '0 0 10px rgba(255,80,80,0.4)',
          }}>
            {isUp ? '+' : ''}{displayChange?.toFixed(2) || "0.00"} ({isUp ? '+' : ''}{displayChangePct?.toFixed(2) || "0.00"}%)
          </span>
          <span style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: 11,
            fontWeight: 500,
          }}>
            {TIMEFRAMES.find(t => t.label === chartRange)?.full}
          </span>
        </div>
      </div>

      {/* EMA Settings - Top Center */}
      <div style={{ 
        position: 'absolute', 
        top: -2, 
        left: '50%', 
        transform: 'translateX(-50%)',
        zIndex: 10,
        display: 'flex',
        gap: 4,
        background: 'rgba(0,0,0,0.4)',
        padding: '4px 8px',
        borderRadius: 20,
        backdropFilter: 'blur(8px)',
      }}>
        {EMA_PRESETS.map(preset => {
          const isActive = emaSettings.some(e => e.period === preset.period && e.isSMA === preset.isSMA);
          return (
            <button
              key={preset.label}
              className={`ema-btn ${isActive ? 'active' : ''}`}
              onClick={() => toggleEma(preset.period, preset.color, preset.isSMA)}
              style={{
                borderColor: isActive ? preset.color : 'rgba(255,255,255,0.15)',
                color: isActive ? preset.color : 'rgba(255,255,255,0.4)',
                background: isActive ? `${preset.color}15` : 'transparent',
              }}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 20 }}>
        <PlugChart
          prices={prices}
          isUp={isPositive}
          width={dims.w}
          height={dims.h - 80}
          onHover={setHoverData}
          emaLines={emaLines}
        />
      </div>
      <div style={{ display: "flex", gap: 2, marginTop: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {TIMEFRAMES.map(t => (
          <button
            key={t.label}
            className={`tf-btn${chartRange === t.label ? " active" : ""}`}
            onClick={() => setChartRange(t.label)}
          >{t.label}</button>
        ))}
      </div>
    </div>
  );
}
