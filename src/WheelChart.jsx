import { useState, useEffect, useRef, useMemo, useCallback } from "react";

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

export default function WheelChart({ chartData, price, change, changePct, isPositive, chartRange, setChartRange, ticker = "AAPL" }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [dims, setDims] = useState({ w: 800, h: 300 });
  const [hoverIdx, setHoverIdx] = useState(null);
  const [animProgress, setAnimProgress] = useState(1);
  const animationRef = useRef(null);
  const pulseRef = useRef(0);
  
  const prices = useMemo(() => {
    const arr = chartData?.map(d => d.close).filter(Boolean) || [];
    return downsample(arr, 400);
  }, [chartData]);

  const openPrice = prices[0] || price || 0;
  const currentPrice = price || 0;
  const isUp = currentPrice >= openPrice;
  
  const color = isUp ? '#00c805' : '#ff5000';
  const rgb = isUp ? '0,200,5' : '255,80,0';
  
  const displayPrice = hoverIdx !== null ? prices[hoverIdx] : currentPrice;
  const displayChange = displayPrice - openPrice;
  const displayChangePct = openPrice ? (displayChange / openPrice) * 100 : 0;
  const displayIsUp = displayChange >= 0;

  // Resize observer
  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      if (!entries[0]) return;
      const w = Math.floor(entries[0].contentRect.width);
      const h = Math.floor(w * 0.38);
      setDims({ w, h });
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Entry animation on data change
  useEffect(() => {
    if (!prices.length) return;
    
    setAnimProgress(0);
    const start = performance.now();
    const duration = 700;
    
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimProgress(eased);
      
      if (t < 1) {
        animationRef.current = requestAnimationFrame(tick);
      }
    };
    
    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [prices.length, ticker]);

  // Live dot pulse animation
  useEffect(() => {
    const tick = () => {
      pulseRef.current = (Date.now() % 2000) / 2000;
      drawChart();
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [prices.length, hoverIdx, dims.w, dims.h]);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    const overlay = overlayRef.current;
    if (!canvas || !overlay) return;
    
    const ctx = canvas.getContext('2d');
    const octx = overlay.getContext('2d');
    const { w, h } = dims;
    
    if (w === 0 || h === 0 || !prices.length) return;
    
    const PAD_TOP = 20;
    const PAD_BOTTOM = 30;
    const chartHeight = h - PAD_TOP - PAD_BOTTOM;
    
    // Calculate min/max for scaling
    const min = Math.min(...prices) * 0.995;
    const max = Math.max(...prices) * 1.005;
    const range = max - min || 1;
    
    const xOf = (i) => (i / (prices.length - 1)) * w;
    const yOf = (v) => PAD_TOP + chartHeight - ((v - min) / range) * chartHeight;
    
    const currentIdx = prices.length - 1;
    const lx = xOf(currentIdx);
    const ly = yOf(prices[currentIdx]);
    
    // Clear canvas
    ctx.clearRect(0, 0, w, h);
    
    // Pass 1: Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, `rgba(${rgb}, 0.15)`);
    grad.addColorStop(0.5, `rgba(${rgb}, 0.04)`);
    grad.addColorStop(1, `rgba(${rgb}, 0)`);
    
    const drawCount = Math.floor(animProgress * (prices.length - 1));
    
    ctx.beginPath();
    prices.slice(0, drawCount + 1).forEach((v, i) => {
      const x = xOf(i), y = yOf(v);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.lineTo(xOf(drawCount), h - PAD_BOTTOM);
    ctx.lineTo(0, h - PAD_BOTTOM);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Pass 2: The line
    ctx.beginPath();
    prices.slice(0, drawCount + 1).forEach((v, i) => {
      const x = xOf(i), y = yOf(v);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.75;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Pass 3: Live dot pulse
    if (animProgress >= 1) {
      const pulse = pulseRef.current;
      
      // Expanding ring
      ctx.beginPath();
      ctx.arc(lx, ly, 3.5 + pulse * 8, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${rgb}, ${0.5 * (1 - pulse)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Solid center dot
      ctx.beginPath();
      ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    
    // Draw crosshair on overlay
    octx.clearRect(0, 0, w, h);
    
    if (hoverIdx !== null && hoverIdx < prices.length) {
      const hx = xOf(hoverIdx);
      const hy = yOf(prices[hoverIdx]);
      
      // Vertical dashed line
      octx.setLineDash([4, 4]);
      octx.strokeStyle = 'rgba(255,255,255,0.15)';
      octx.lineWidth = 1;
      octx.beginPath();
      octx.moveTo(hx, 0);
      octx.lineTo(hx, h);
      octx.stroke();
      octx.setLineDash([]);
      
      // White dot at data point
      octx.beginPath();
      octx.arc(hx, hy, 5, 0, Math.PI * 2);
      octx.fillStyle = '#fff';
      octx.fill();
    }
  }, [prices, dims, color, rgb, animProgress, hoverIdx]);

  const handleMouseMove = (e) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const idx = Math.round((mx / dims.w) * (prices.length - 1));
    setHoverIdx(Math.max(0, Math.min(prices.length - 1, idx)));
  };

  const handleMouseLeave = () => {
    setHoverIdx(null);
  };

  const chartHeight = 380;

  if (!prices.length) {
    return (
      <div ref={containerRef} style={{ width: '100%', height: chartHeight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', background: 'rgba(10,10,12,0.9)', borderRadius: 14 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Loading chart...</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>{ticker}</div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: chartHeight, position: 'relative', background: 'rgba(10,10,12,0.9)', borderRadius: 14, overflow: 'hidden' }}>
      {/* Base canvas - chart */}
      <canvas
        ref={canvasRef}
        width={dims.w}
        height={chartHeight}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
      {/* Overlay canvas - crosshair */}
      <canvas
        ref={overlayRef}
        width={dims.w}
        height={chartHeight}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'crosshair' }}
      />
      
      {/* Price display - top left */}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
        <div style={{ 
          fontSize: 36, 
          fontWeight: 700, 
          fontFamily: "'DM Mono', monospace",
          color: '#ffffff',
          textShadow: '0 0 20px rgba(255,255,255,0.25)',
        }}>
          ${displayPrice?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <span style={{
            color: displayIsUp ? "#00c805" : "#ff5000",
            fontSize: 14,
            fontFamily: "'DM Mono', monospace",
            fontWeight: 600,
            textShadow: displayIsUp ? '0 0 10px rgba(0,200,5,0.4)' : '0 0 10px rgba(255,80,0,0.4)',
          }}>
            {displayIsUp ? '+' : ''}{displayChange?.toFixed(2) || "0.00"} ({displayIsUp ? '+' : ''}{displayChangePct?.toFixed(2) || "0.00"}%)
          </span>
        </div>
      </div>
      
      {/* Timeframe selector - top right */}
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 2, zIndex: 10, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 200 }}>
        {TIMEFRAMES.slice(0, 6).map(tf => (
          <button
            key={tf.label}
            onClick={() => setChartRange(tf.label)}
            style={{
              background: chartRange === tf.label ? 'rgba(255,255,255,0.15)' : 'transparent',
              border: 'none',
              borderRadius: 4,
              padding: '4px 8px',
              color: chartRange === tf.label ? '#fff' : 'rgba(255,255,255,0.35)',
              fontSize: 10,
              fontWeight: chartRange === tf.label ? 600 : 400,
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            {tf.label}
          </button>
        ))}
      </div>
    </div>
  );
}
