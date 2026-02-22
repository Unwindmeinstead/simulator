import { useState, useEffect, useRef, useMemo, useCallback } from "react";

const TIMEFRAMES = [
  { label: "1D", full: "Today" },
  { label: "1W", full: "1 Week" },
  { label: "1M", full: "1 Month" },
  { label: "3M", full: "3 Months" },
  { label: "6M", full: "6 Months" },
  { label: "1Y", full: "1 Year" },
  { label: "5Y", full: "5 Years" },
  { label: "ALL", full: "All Time" },
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

export default function WheelChart({ chartData, price, change, changePct, isPositive, chartRange, setChartRange, ticker = "AAPL" }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [dims, setDims] = useState({ w: 800, h: 300 });
  const [hoverIdx, setHoverIdx] = useState(null);
  const animationRef = useRef(null);
  
  const prices = useMemo(() => {
    const arr = chartData?.map(d => d.close).filter(Boolean) || [];
    return downsample(arr, 150);
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

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !prices.length) return;
    
    const ctx = canvas.getContext('2d');
    const { w, h } = dims;
    
    if (w === 0 || h === 0) return;

    // DPR scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);
    
    const PAD_TOP = 20;
    const PAD_BOTTOM = 30;
    const chartHeight = h - PAD_TOP - PAD_BOTTOM;
    const chartBottom = PAD_TOP + chartHeight;
    
    const min = Math.min(...prices) * 0.998;
    const max = Math.max(...prices) * 1.002;
    const range = max - min || 1;
    
    const xOf = (i) => (i / (prices.length - 1)) * w;
    const yOf = (v) => PAD_TOP + chartHeight - ((v - min) / range) * chartHeight;
    
    // Build points
    const pts = prices.map((v, i) => ({ x: xOf(i), y: yOf(v) }));
    
    // Clear
    ctx.clearRect(0, 0, w, h);
    
    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, `rgba(${rgb}, 0.15)`);
    grad.addColorStop(0.6, `rgba(${rgb}, 0.03)`);
    grad.addColorStop(1, `rgba(${rgb}, 0)`);
    
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, chartBottom);
    ctx.lineTo(pts[0].x, chartBottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    
    // Line
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    
    // Live dot
    const lx = pts[pts.length - 1].x;
    const ly = pts[pts.length - 1].y;
    const pulse = (Date.now() % 2000) / 2000;
    
    ctx.beginPath();
    ctx.arc(lx, ly, 3.5 + pulse * 7, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${rgb}, ${0.45 * (1 - pulse)})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(lx, ly, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    
    // Y-axis labels
    ctx.font = "10px 'DM Mono', monospace";
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i <= 3; i++) {
      const v = min + (i / 3) * range;
      ctx.fillText(`$${v.toFixed(2)}`, w - 6, yOf(v));
    }
  }, [prices, dims, color, rgb]);

  // Animation loop
  useEffect(() => {
    const tick = () => {
      drawChart();
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [drawChart]);

  const handleMouseMove = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
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
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'crosshair' }}
      />
      
      {/* Price display - top left */}
      <div style={{ position: 'absolute', top: 24, left: 20, zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ 
          fontSize: 26, 
          fontWeight: 600, 
          fontFamily: "'DM Mono', monospace",
          color: '#ffffff',
          letterSpacing: '-0.02em',
        }}>
          ${displayPrice?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{
            color: displayIsUp ? "#00c805" : "#ff5000",
            fontSize: 12,
            fontFamily: "'DM Mono', monospace",
            fontWeight: 500,
          }}>
            {displayIsUp ? '+' : ''}{displayChange?.toFixed(2) || "0.00"} ({displayIsUp ? '+' : ''}{displayChangePct?.toFixed(2) || "0.00"}%)
          </span>
        </div>
      </div>
      
      {/* Timeframe selector - top right */}
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1, zIndex: 10 }}>
        {TIMEFRAMES.map(tf => (
          <button
            key={tf.label}
            onClick={() => setChartRange(tf.label)}
            style={{
              background: chartRange === tf.label ? 'rgba(255,255,255,0.15)' : 'transparent',
              border: 'none',
              borderRadius: 4,
              padding: '4px 8px',
              color: chartRange === tf.label ? '#fff' : 'rgba(255,255,255,0.55)',
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
