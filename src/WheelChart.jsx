import { useEffect, useRef, useMemo } from "react";
import { createChart, ColorType } from "lightweight-charts";

const TIMEFRAMES = [
  { label: "1D", range: "1d" },
  { label: "1W", range: "5d" },
  { label: "1M", range: "1mo" },
  { label: "3M", range: "3mo" },
  { label: "6M", range: "6mo" },
  { label: "1Y", range: "1y" },
  { label: "5Y", range: "5y" },
  { label: "ALL", range: "max" },
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
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const initializedRef = useRef(false);
  
  const prices = useMemo(() => {
    const arr = chartData?.map(d => d.close).filter(Boolean) || [];
    return downsample(arr, 200);
  }, [chartData]);

  const openPrice = prices[0] || price || 0;
  const currentPrice = price || 0;
  const isUp = currentPrice >= openPrice;
  
  const color = isUp ? '#00c805' : '#ff5000';
  const areaTopColor = isUp ? 'rgba(0, 200, 5, 0.4)' : 'rgba(255, 80, 0, 0.4)';
  const areaBottomColor = isUp ? 'rgba(0, 200, 5, 0.0)' : 'rgba(255, 80, 0, 0.0)';
  
  const displayPrice = currentPrice;
  const displayChange = displayPrice - openPrice;
  const displayChangePct = openPrice ? (displayChange / openPrice) * 100 : 0;
  const displayIsUp = displayChange >= 0;

  // Initialize chart once
  useEffect(() => {
    if (!chartContainerRef.current || initializedRef.current) return;

    const container = chartContainerRef.current;
    
    const initChart = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      
      if (w === 0 || h === 0) {
        setTimeout(initChart, 100);
        return;
      }

      const chart = createChart(container, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: 'rgba(255,255,255,0.6)',
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.03)' },
          horzLines: { color: 'rgba(255,255,255,0.03)' },
        },
        width: w,
        height: h,
        rightPriceScale: {
          borderColor: 'rgba(255,255,255,0.1)',
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: {
          borderColor: 'rgba(255,255,255,0.1)',
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          mode: 0,
          vertLine: {
            color: 'rgba(255,255,255,0.2)',
            width: 1,
            style: 2,
          },
          horzLine: {
            color: 'rgba(255,255,255,0.2)',
            width: 1,
            style: 2,
          },
        },
      });

      const areaSeries = chart.addAreaSeries({
        lineColor: color,
        topColor: areaTopColor,
        bottomColor: areaBottomColor,
        lineWidth: 2,
        priceFormat: { type: 'custom', formatter: (p) => `$${p.toFixed(2)}` },
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 4,
      });

      chartRef.current = chart;
      seriesRef.current = areaSeries;
      initializedRef.current = true;

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          });
        }
      };
      
      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          seriesRef.current = null;
          initializedRef.current = false;
        }
      };
    };

    // Small delay to ensure container is rendered
    const timer = setTimeout(initChart, 100);
    return () => clearTimeout(timer);
  }, []);

  // Update data when chartData changes
  useEffect(() => {
    if (!seriesRef.current || !chartData?.length) return;

    const data = chartData.map((d) => ({
      time: d.timestamp || Math.floor(Date.now() / 1000),
      value: d.close,
    })).filter(d => d.value);

    if (data.length) {
      seriesRef.current.setData(data);
      chartRef.current?.timeScale().fitContent();
    }
  }, [chartData]);

  // Update colors when direction changes
  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.applyOptions({
      lineColor: color,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
    });
  }, [color, areaTopColor, areaBottomColor]);

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
      <div ref={chartContainerRef} style={{ width: '100%', height: '100%' }} />
      
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
