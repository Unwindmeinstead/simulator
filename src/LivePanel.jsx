import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Card } from './ui'
import OptionsChain from './OptionsChain'
import WheelChart from './WheelChart'
import OptionScanner from './OptionScanner'

const normalPDF = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI)

const normalCDF = (x) => {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911
  const sign = x < 0 ? -1 : 1
  const absX = Math.abs(x) / Math.sqrt(2)
  const t = 1 / (1 + p * absX)
  const y = 1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX))
  return 0.5 * (1 + sign * y)
}

function bs(S, K, T, r, sigma, type) {
  if (T <= 0) {
    const intrinsic = type === "call" ? Math.max(0, S - K) : Math.max(0, K - S);
    return { price: intrinsic, delta: type === "call" ? (S > K ? 1 : 0) : (S < K ? -1 : 0), gamma: 0, theta: 0, vega: 0, iv: sigma };
  }
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const price = type === "call" ? S * normalCDF(d1) - K * Math.exp(-r * T) * normalCDF(d2) : K * Math.exp(-r * T) * normalCDF(-d2) - S * normalCDF(-d1);
  const delta = type === "call" ? normalCDF(d1) : normalCDF(d1) - 1;
  const gamma = normalPDF(d1) / (S * sigma * Math.sqrt(T));
  const theta = type === "call" ? (-S * normalPDF(d1) * sigma / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * normalCDF(d2)) / 365 : (-S * normalPDF(d1) * sigma / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * normalCDF(-d2)) / 365;
  const vega = S * normalPDF(d1) * Math.sqrt(T) / 100;
  return { price: Math.max(0.01, price), delta, gamma, theta, vega, iv: sigma };
}

const POPULAR_STOCKS = ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'NFLX', 'AMD', 'INTC', 'COIN', 'PLTR']

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

function OIBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(1, value / max) * 100 : 0;
  return (
    <div style={{ width: "100%", height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.4s ease" }} />
    </div>
  );
}

const fmt2 = n => n?.toFixed(2) ?? "—"
const fmt3 = n => n?.toFixed(3) ?? "—"
const fmtK = n => n >= 1000 ? (n / 1000).toFixed(1) + "K" : n?.toString() ?? "—"
const fmtPct = n => (n * 100).toFixed(1) + "%"

export default function LivePanel({ bp }) {
  const getInitialWatchlist = () => {
    const saved = localStorage.getItem('wheel_watchlist')
    return saved ? JSON.parse(saved) : ['AAPL', 'TSLA', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'AMD']
  }
  const initialWatchlist = getInitialWatchlist()

  const [ticker, setTicker] = useState(initialWatchlist[0] || 'AAPL')
  const [input, setInput] = useState(initialWatchlist[0] || 'AAPL')
  const [loading, setLoading] = useState(true)
  const [chartRange, setChartRange] = useState('1MO')
  const [watchlist, setWatchlist] = useState(initialWatchlist)
  const [watchlistData, setWatchlistData] = useState({})
  const [connectionOk, setConnectionOk] = useState(true)

  const removeFromWatchlist = (sym, e) => {
    e.stopPropagation()
    const updated = watchlist.filter(s => s !== sym)
    setWatchlist(updated)
    localStorage.setItem('wheel_watchlist', JSON.stringify(updated))
  }

  const [price, setPrice] = useState(null)
  const [change, setChange] = useState(0)
  const [changePct, setChangePct] = useState(0)
  const [stats, setStats] = useState({})
  const [chartData, setChartData] = useState([])
  const [dataTime, setDataTime] = useState(null)
  const [exps, setExps] = useState([])
  const [exp, setExp] = useState('')
  const [opts, setOpts] = useState({ calls: [], puts: [] })
  const [hoverData, setHoverData] = useState(null)
  const [chartDims, setChartDims] = useState({ w: 760, h: 340 })
  const chartContainerRef = useRef(null)
  const latestRequestRef = useRef(0)

  const isMobile = bp === 'xs' || bp === 'sm'

  const loadData = useCallback(async (symbol) => {
    const requestId = ++latestRequestRef.current
    
    setPrice(null)
    setChange(0)
    setChangePct(0)
    setStats({})
    setChartData([])
    setExps([])
    setExp('')
    setOpts({ calls: [], puts: [] })

    setLoading(true)
    const upper = symbol.toUpperCase()
    const cacheBust = `&_t=${Date.now()}`

    try {
      let apiRange = chartRange;
      if (['5m', '15m', '30m', '1H', '4H'].includes(chartRange)) {
        apiRange = `1D&interval=${chartRange}`;
      }

      const [quoteRes, chartRes, optRes] = await Promise.all([
        fetch(`/api/quote?symbol=${upper}${cacheBust}`),
        fetch(`/api/chart?symbol=${upper}&range=${apiRange}${cacheBust}`),
        fetch(`/api/options?symbol=${upper}${cacheBust}`)
      ])

      // Check if this request is still the latest
      if (requestId !== latestRequestRef.current) {
        return
      }

      const quote = await quoteRes.json()
      const chart = await chartRes.json()
      const opt = await optRes.json()

      // Check if ticker changed - ignore stale response
      if (upper !== ticker) {
        return
      }

      if (quote?.regularMarketPrice || quote?.regularMarketPrice === 0) {
        setPrice(quote.regularMarketPrice)
        setChange(quote.regularMarketChange || 0)
        setChangePct(quote.regularMarketChangePercent || 0)
        setStats({ open: quote.regularMarketOpen, high: quote.regularMarketDayHigh, low: quote.regularMarketDayLow, prevClose: quote.chartPreviousClose || quote.regularMarketPreviousClose, volume: quote.regularMarketVolume, peRatio: quote.forwardPE })
        setChartData(chart?.chart || [])
        setDataTime(new Date())
        setConnectionOk(true)

        if (opt?.options?.length) {
          const expList = opt.options.map(optItem => {
            const date = new Date(optItem.expirationDate)
            const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            return { value: optItem.expirationDate, label: `${monthDay}`, subLabel: `${days}D`, days, data: optItem }
          }).filter(e => e.days > -3).sort((a, b) => a.days - b.days)

          setExps(expList)
          if (expList.length > 0) {
            setExp(expList[0].value)
            setOpts({ calls: expList[0].data.calls || [], puts: expList[0].data.puts || [] })
          }
        }
      }
    } catch (e) {
      console.error(e)
      setConnectionOk(false)
    }
    setLoading(false)
  }, [chartRange, ticker])

  useEffect(() => { if (ticker) loadData(ticker) }, [ticker])

  useEffect(() => {
    const ro = new ResizeObserver(entries => {
      const w = Math.floor(entries[0].contentRect.width);
      const h = Math.min(380, Math.max(220, Math.floor(w * 0.42)));
      setChartDims({ w, h });
    });
    if (chartContainerRef.current) ro.observe(chartContainerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!ticker || !price) return
    const loadChartOnly = async () => {
      try {
        const chartRes = await fetch(`/api/chart?symbol=${ticker}&range=${chartRange}&_t=${Date.now()}`)
        if (!chartRes.ok) {
          console.error('Chart API error:', chartRes.status)
          return
        }
        const chart = await chartRes.json()
        if (chart?.chart?.length > 0) setChartData(chart.chart)
      } catch (e) { 
        console.error('Chart load error:', e)
      }
    }
    loadChartOnly()
  }, [chartRange, ticker, price])

  useEffect(() => {
    const loadWatchlist = async () => {
      const symbols = watchlist.filter(s => s !== ticker)
      if (!symbols.length) return
      try {
        const res = await fetch(`/api/quotes?symbols=${symbols.join(',')}`)
        const data = await res.json()
        const freshData = {}
        symbols.forEach((s, i) => {
          if (data[i]) freshData[s] = { price: data[i].regularMarketPrice, changePct: data[i].regularMarketChangePercent }
        })
        setWatchlistData(prev => ({ ...prev, ...freshData }))
      } catch (e) { }
    }
    loadWatchlist()
    const interval = setInterval(loadWatchlist, 10000)
    return () => clearInterval(interval)
  }, [watchlist, ticker])

  const handleSearch = (symbol) => {
    const s = (symbol || '').toUpperCase().trim()
    if (s) { setTicker(s); setInput(s) }
  }

  const handleExpClick = (e) => {
    setExp(e.value)
    setOpts({ calls: e.data.calls || [], puts: e.data.puts || [] })
  }

  const isPositive = change >= 0
  const color = isPositive ? '#00ff88' : '#ff5050'

  const downsampledPrices = useMemo(() => {
    const prices = chartData?.map(d => d.close).filter(Boolean) || [];
    return downsample(prices, 600);
  }, [chartData]);

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', minHeight: 'calc(100vh - 80px)', overflowX: 'hidden' }}>
      <style>{`
        @keyframes priceFlashUp { 0% { background: rgba(0,255,136,0.25) } 100% { background: transparent } }
        @keyframes priceFlashDown { 0% { background: rgba(255,80,80,0.25) } 100% { background: transparent } }
      `}</style>

      <div style={{ width: '100%' }}>
        <Card style={{ marginBottom: 16, background: 'rgba(10,10,12,0.9)', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'rgba(255,255,255,0.04)', 
                border: '1px solid rgba(255,255,255,0.08)', 
                borderRadius: 10,
                padding: '10px 14px',
                gap: 10,
                transition: 'all 0.2s',
              }}>
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSearch(input)} 
                  placeholder="Search symbol..." 
                  style={{ 
                    flex: 1,
                    background: 'transparent', 
                    border: 'none', 
                    color: '#fff', 
                    fontSize: 14, 
                    fontFamily: "'DM Sans', sans-serif",
                    outline: 'none',
                    fontWeight: 500,
                  }} 
                />
                <span style={{ 
                  fontSize: 10, 
                  color: 'rgba(255,255,255,0.25)', 
                  background: 'rgba(255,255,255,0.06)',
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontFamily: "'DM Mono', monospace",
                }}>↵</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: "'DM Mono', monospace" }}>{ticker}</span>
              {connectionOk ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#00ff88', fontWeight: 600, background: 'rgba(0,255,136,0.1)', padding: '4px 10px', borderRadius: 20 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ff88' }} />
                  LIVE
                </span>
              ) : (
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>OFFLINE</span>
              )}
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Mono', monospace" }}>
                {dataTime ? dataTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
              </span>
            </div>
          </div>
        </Card>

        {/* Horizontal Watchlist Bar */}
        <Card style={{ marginBottom: 16, background: 'rgba(10,10,12,0.9)', padding: '10px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase', marginRight: 4 }}>Watchlist:</span>
            {watchlist.slice(0, 15).map(sym => {
              const wData = watchlistData[sym]
              const displayPrice = wData?.price
              const displayChange = wData?.changePct
              const wPositive = displayChange >= 0
              return (
                <div 
                  key={sym}
                  onClick={() => { setTicker(sym); setInput(sym) }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6,
                    padding: '4px 10px', 
                    borderRadius: 6, 
                    cursor: 'pointer', 
                    background: sym === ticker ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.05)', 
                    border: sym === ticker ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>{sym}</span>
                  {displayPrice && (
                    <span style={{ color: wPositive ? '#00ff88' : '#ff5050', fontSize: 10, fontFamily: "'DM Mono', monospace" }}>
                      ${displayPrice.toFixed(2)}
                    </span>
                  )}
                  {displayChange !== undefined && (
                    <span style={{ color: wPositive ? '#00ff88' : '#ff5050', fontSize: 9, fontFamily: "'DM Mono', monospace" }}>
                      {wPositive ? '+' : ''}{displayChange.toFixed(1)}%
                    </span>
                  )}
                </div>
              )
            })}
            <input 
              placeholder="+"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const val = e.target.value.trim().toUpperCase();
                  if (val && !watchlist.includes(val)) {
                    const updated = [...watchlist, val];
                    setWatchlist(updated);
                    localStorage.setItem('wheel_watchlist', JSON.stringify(updated));
                    e.target.value = '';
                  }
                }
              }}
              style={{ 
                width: 30,
                background: 'rgba(255,255,255,0.04)', 
                border: '1px solid rgba(255,255,255,0.08)', 
                borderRadius: 4,
                padding: '4px 6px',
                color: '#fff',
                fontSize: 11,
                outline: 'none',
              }} 
            />
          </div>
        </Card>

        {price !== null && (
          <>
            <Card style={{ marginBottom: 16, padding: 20, minHeight: 400, position: 'relative', overflow: 'hidden' }}>
              <WheelChart
                chartData={chartData}
                price={price}
                change={change}
                changePct={changePct}
                isPositive={isPositive}
                chartRange={chartRange}
                setChartRange={setChartRange}
                ticker={ticker}
              />
            </Card>

            <Card style={{ marginBottom: 16, padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)', gap: 8 }}>
                {[{ k: 'Open', v: stats.open }, { k: 'High', v: stats.high }, { k: 'Low', v: stats.low }, { k: 'Prev', v: stats.prevClose }, { k: 'Volume', v: (stats.volume / 1000000).toFixed(1) + 'M' }, { k: 'P/E', v: stats.peRatio?.toFixed(1) }].map(x => (
                  <div key={x.k} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: 6 }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 2 }}>{x.k}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{x.v || '—'}</div>
                  </div>
                ))}
              </div>
            </Card>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>Expiration Dates</div>
                <div style={{ fontSize: 10, color: '#00ff88', fontWeight: 600, background: 'rgba(0,255,136,0.1)', padding: '2px 8px', borderRadius: 10 }}>{exps.length} AVAILABLE</div>
              </div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                {exps.slice(0, 12).map((e, i) => (
                  <button key={i} onClick={() => handleExpClick(e)} style={{ flexShrink: 0, padding: '12px 24px', background: exp === e.value ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${exp === e.value ? '#00ff88' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, color: exp === e.value ? '#00ff88' : 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins', transition: 'all 0.2s' }}>
                    <span style={{ fontSize: 13 }}>{e.label}</span>
                    <span style={{ fontSize: 9, color: exp === e.value ? '#00ff88' : 'rgba(255,255,255,0.4)', opacity: 0.8, textTransform: 'uppercase', display: 'block' }}>{e.subLabel}</span>
                  </button>
                ))}
              </div>
            </div>

            <OptionsChain ticker={ticker} calls={opts.calls} puts={opts.puts} currentPrice={price} expLabel={exps.find(e => e.value === exp)?.label || ''} daysToExp={exps.find(e => e.value === exp)?.days || 30} />
            <div style={{ marginTop: 24 }}>
              <OptionScanner />
            </div>
          </>
        )}

        {price === null && !loading && (
          <Card>
            <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'rgba(255,255,255,0.5)' }}>Enter a stock symbol</div>
              <div style={{ fontSize: 12 }}>{POPULAR_STOCKS.join(' · ')}</div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
