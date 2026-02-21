import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import YahooFinance from 'yahoo-finance2'
import axios from 'axios'

const yf = new YahooFinance()

const apiHandler = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const symbol = url.searchParams.get('symbol')
  const expiration = url.searchParams.get('expiration')
  
  if (!symbol) {
    res.statusCode = 400
    res.end(JSON.stringify({ error: 'Symbol required' }))
    return
  }
  
  try {
    let options = await yf.options(symbol)
    
    if (!expiration) {
      const allExps = await Promise.all(
        options.expirationDates.slice(0, 10).map(async (expDate) => {
          try {
            const opts = await yf.options(symbol, { date: expDate })
            return opts.options?.[0] || null
          } catch (e) {
            return null
          }
        })
      )
      
      const validExps = allExps.filter(e => e !== null)
      if (validExps.length > 0) {
        options = { ...options, options: validExps }
      }
    } else {
      let targetDate
      if (expiration.includes('T')) {
        targetDate = expiration.split('T')[0]
      } else if (/^\d+$/.test(expiration)) {
        targetDate = new Date(parseInt(expiration) * 1000).toISOString().split('T')[0]
      } else {
        targetDate = expiration
      }
      const expOpt = options.options?.find(o => 
        o.expirationDate && typeof o.expirationDate === 'string' && o.expirationDate.startsWith(targetDate)
      )
      if (expOpt) {
        options = { ...options, optionsChain: expOpt }
      }
    }
    
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(options))
  } catch (err) {
    res.statusCode = 500
    res.end(JSON.stringify({ error: err.message }))
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-proxy',
      configureServer(server) {
        server.middlewares.use('/api/options', apiHandler)
        server.middlewares.use('/api/quote', async (req, res) => {
          const url = new URL(req.url, `http://${req.headers.host}`)
          const symbol = url.searchParams.get('symbol')
          
          if (!symbol) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Symbol required' }))
            return
          }
          
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000)
            
            const quote = await yf.quote(symbol)
            clearTimeout(timeoutId)
            
            // Fetch pre/post market data
            let preMarketPrice = null
            let preMarketChange = null
            let postMarketPrice = null
            let postMarketChange = null
            
            try {
              // Try to get pre/post market data from chart endpoint
              const extController = new AbortController()
              const extTimeout = setTimeout(() => extController.abort(), 5000)
              const extResponse = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`, { signal: extController.signal })
              clearTimeout(extTimeout)
              const extData = extResponse.data.chart?.result?.[0]
              if (extData?.meta) {
                preMarketPrice = extData.meta.preMarketPrice || null
                preMarketChange = extData.meta.preMarketChange || null
                postMarketPrice = extData.meta.postMarketPrice || null
                postMarketChange = extData.meta.postMarketChange || null
              }
            } catch (extErr) {
              // Extended hours not available
            }
            
            const result = {
              ...quote,
              preMarketPrice,
              preMarketChange,
              postMarketPrice,
              postMarketChange,
              lastUpdated: new Date().toISOString()
            }
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (err) {
            try {
              const fallbackController = new AbortController()
              const fallbackTimeout = setTimeout(() => fallbackController.abort(), 10000)
              const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, { signal: fallbackController.signal })
              clearTimeout(fallbackTimeout)
              const data = response.data.chart?.result?.[0]
              if (data?.meta) {
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  regularMarketPrice: data.meta.regularMarketPrice || 0,
                  regularMarketChange: data.meta.regularMarketChange || 0,
                  regularMarketChangePercent: data.meta.regularMarketChangePercent || 0,
                  regularMarketOpen: data.meta.chartPreviousClose || 0,
                  regularMarketDayHigh: data.meta.dayHigh || 0,
                  regularMarketDayLow: data.meta.dayLow || 0,
                  regularMarketPreviousClose: data.meta.chartPreviousClose || 0,
                  regularMarketVolume: data.meta.volume || 0,
                  lastUpdated: new Date().toISOString(),
                  _delayed: true
                }))
                return
              }
            } catch (e2) {}
            res.statusCode = 500
            res.end(JSON.stringify({ error: err.message }))
          }
        })

        server.middlewares.use('/api/quotes', async (req, res) => {
          const url = new URL(req.url, `http://${req.headers.host}`)
          const symbols = url.searchParams.get('symbols')?.split(',').filter(Boolean) || []
          
          if (!symbols.length) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Symbols required' }))
            return
          }
          
          try {
            const quotes = await Promise.all(
              symbols.map(async (symbol) => {
                try {
                  const quote = await yf.quote(symbol)
                  return quote
                } catch (e) {
                  return null
                }
              })
            )
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(quotes))
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: err.message }))
          }
        })
        
        server.middlewares.use('/api/chart', async (req, res) => {
          const url = new URL(req.url, `http://${req.headers.host}`)
          const symbol = url.searchParams.get('symbol')
          let range = url.searchParams.get('range') || '1mo'
          let interval = url.searchParams.get('interval') || '1d'
          
          if (range.includes('&interval=')) {
            const parts = range.split('&interval=')
            range = parts[0]
            interval = parts[1]
          }
          
          if (!symbol) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Symbol required' }))
            return
          }
          
          const rangeMap = { 
            '5M': '1d', '15M': '1d', '30M': '1d', '1H': '1d', '4H': '1d', '1D': '1d', 
            '5D': '5d', '1WO': '1mo', '3MO': '3mo', '6MO': '6mo', '1Y': '1y', '5Y': '5y', 
            'MAX': 'max', 'ALL': 'max',
            '1W': '5d', '1M': '1mo', '3M': '3mo'
          }
          const intervalMap = {
            '5M': '5m', '15M': '5m', '30M': '30m', '1H': '15m', '4H': '1h', '1D': '5m',
            '5D': '1d', '1WO': '1d', '3MO': '1d', '6MO': '1d', '1Y': '1d', '5Y': '1wk', 
            'MAX': '1mo', 'ALL': '1mo',
            '1W': '1d', '1M': '1d', '3M': '1d'
          }
          const rangeParam = rangeMap[range.toUpperCase()] || '1mo'
          const intervalParam = intervalMap[range.toUpperCase()] || interval
          
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 15000)
          
          try {
            const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${intervalParam}&range=${rangeParam}`, { signal: controller.signal })
            const data = response.data.chart?.result?.[0]
            
            if (data) {
              const timestamps = data.timestamp || []
              const quote = data.indicators?.quote?.[0] || {}
              const chartData = timestamps.map((ts, i) => ({
                date: new Date(ts * 1000).toISOString().split('T')[0],
                timestamp: ts,
                open: quote.open?.[i],
                high: quote.high?.[i],
                low: quote.low?.[i],
                close: quote.close?.[i],
                volume: quote.volume?.[i]
              })).filter(d => d.close !== null)
              
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ symbol, range, meta: data.meta, chart: chartData }))
            } else {
              res.statusCode = 404
              res.end(JSON.stringify({ error: 'No data found' }))
            }
          } catch (err) {
            res.statusCode = err.name === 'AbortError' ? 504 : 500
            res.end(JSON.stringify({ error: err.message }))
          } finally {
            clearTimeout(timeoutId)
          }
        })
      }
    },
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Wheel Calculator',
        short_name: 'Wheel',
        theme_color: '#08090b',
        background_color: '#08090b',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
})
