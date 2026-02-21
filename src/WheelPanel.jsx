import { useState, useMemo } from 'react'
import { calcCSP, calcCC, calcRequiredStrikeCSP, calcRequiredPremiumCC, fmtD, fmtPct } from './math'
import { NumField, Card, KV, Sep, Badge, Lbl, ACC, GB, G } from './ui'
import PayoffChart from './PayoffChart'

function WheelLeg({ phase, stockPrice, strike, premium, dte, result, isDesktop }) {
  const isCSP = phase === 'CSP'
  
  return (
    <div style={{
      flex: 1,
      minWidth: isDesktop ? 0 : '100%',
      background: 'rgba(255,255,255,0.02)',
      borderRadius: 8,
      padding: 14,
      border: `1px solid ${isCSP ? 'rgba(0,224,122,0.15)' : 'rgba(255,160,80,0.15)'}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ 
          fontSize: 10, 
          padding: '2px 8px', 
          borderRadius: 10, 
          background: isCSP ? ACC : '#ffa050',
          color: '#08090b',
          fontWeight: 700,
          fontFamily: 'Poppins'
        }}>
          {phase}
        </span>
        <Lbl style={{ margin: 0, color: 'rgba(255,255,255,0.5)' }}>
          {isCSP ? 'Cash Secured Put' : 'Covered Call'}
        </Lbl>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Strike
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: isCSP ? ACC : '#ffa050' }}>
            {strike ? fmtD(strike) : '—'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Premium
          </div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>
            {premium ? fmtD(premium) : '—'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Yield
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: result ? ACC : undefined }}>
            {result ? fmtPct(result.yieldPct) : '—'}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Breakeven
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#ffffff' }}>
            {result ? fmtD(result.be) : '—'}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WheelPanel({ bp }) {
  const [stockPrice, setStockPrice] = useState('')
  const [dte, setDte] = useState('')
  const [budget, setBudget] = useState('')
  const [desiredRoi, setDesiredRoi] = useState('')
  const [ccStrike, setCcStrike] = useState('')
  const [ccPremium, setCcPremium] = useState('')
  const [cspStrike, setCspStrike] = useState('')
  const [cspPremium, setCspPremium] = useState('')

  const sp = parseFloat(stockPrice) || 0
  
  const targetCspStrike = useMemo(() => {
    if (!stockPrice || !cspPremium || !desiredRoi) return null
    return calcRequiredStrikeCSP(stockPrice, cspPremium, desiredRoi)
  }, [stockPrice, cspPremium, desiredRoi])

  const targetCcPremium = useMemo(() => {
    if (!stockPrice || !ccStrike || !desiredRoi) return null
    return calcRequiredPremiumCC(stockPrice, ccStrike, desiredRoi)
  }, [stockPrice, ccStrike, desiredRoi])

  const effectiveCspStrike = targetCspStrike || cspStrike
  const effectiveCcPremium = targetCcPremium || ccPremium

  const cspResult = useMemo(() => {
    if (!stockPrice || !effectiveCspStrike || !cspPremium) return null
    return calcCSP({ stockPrice, strikePrice: effectiveCspStrike, premium: cspPremium, dte, budget })
  }, [stockPrice, effectiveCspStrike, cspPremium, dte, budget])

  const ccResult = useMemo(() => {
    if (!stockPrice || !ccStrike || !effectiveCcPremium) return null
    return calcCC({ stockPrice, strikePrice: ccStrike, premium: effectiveCcPremium, dte, budget: '' })
  }, [stockPrice, ccStrike, effectiveCcPremium, dte])

  const isDesktop = bp === 'md' || bp === 'lg' || bp === 'xl'

  const wheelResults = useMemo(() => {
    if (!cspResult || !ccResult) return null
    
    const cspYield = cspResult.yieldPct / 100
    const ccYield = ccResult.yieldPct / 100
    const totalYield = cspYield + ccYield
    
    return {
      cspYieldPct: cspResult.yieldPct,
      ccYieldPct: ccResult.yieldPct,
      totalYieldPct: totalYield * 100,
      cspBreakeven: cspResult.be,
      ccBreakeven: ccResult.be,
      totalPremium: cspPremium && ccPremium ? (parseFloat(cspPremium) + parseFloat(ccPremium)) : null,
      avgCostBasis: (cspResult.be + ccResult.be) / 2,
      deployed: cspResult.bud ? cspResult.bud.cashUsed : cspResult.be * 100
    }
  }, [cspResult, ccResult, cspPremium, ccPremium])

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isDesktop ? '300px 1fr' : '1fr',
      gap: isDesktop ? 28 : 16
    }}>
      <div>
        <Card>
          <Lbl style={{ marginBottom: 12, display: 'block', color: ACC, fontSize: 11 }}>Wheel Strategy Setup</Lbl>
          
          <NumField
            label="Stock Price"
            value={stockPrice}
            onChange={setStockPrice}
            pre="$"
            step={0.01}
            ph="100.00"
            help="Enter the current market price of the stock you want to trade."
          />
          <NumField
            label="Desired ROI (per leg)"
            value={desiredRoi}
            onChange={setDesiredRoi}
            suf="%"
            step={1}
            ph="10"
            note="Target return for each leg"
            help="The return percentage you want to earn on each options leg (CSP and CC)."
          />
          <NumField
            label="Days to Expiration"
            value={dte}
            onChange={setDte}
            suf="DTE"
            step={1}
            ph="30"
            help="Days until options expire. Using same DTE for both legs is recommended."
          />
          <NumField
            label="Budget"
            value={budget}
            onChange={setBudget}
            pre="$"
            step={1000}
            ph="10000"
            help="Total capital available for the wheel strategy."
          />

          <Sep label="CSP Leg" />

          <NumField
            label="CSP Premium"
            value={cspPremium}
            onChange={setCspPremium}
            pre="$"
            step={0.01}
            ph="2.00"
            note="Market premium"
            help="The premium from your broker's option chain for the put you want to sell."
          />
          <NumField
            label="CSP Strike"
            value={cspStrike}
            onChange={setCspStrike}
            pre="$"
            step={0.5}
            ph="Target or manual"
            help="Enter the strike price. Leave blank to use the calculated target strike based on your desired ROI."
          />

          {targetCspStrike && desiredRoi && (
            <div style={{ marginTop: 8, padding: 8, background: 'rgba(0,224,122,0.06)', borderRadius: 6 }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Target Strike</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: ACC }}>{fmtD(targetCspStrike)}</div>
            </div>
          )}

          <Sep label="CC Leg" />

          <NumField
            label="CC Strike"
            value={ccStrike}
            onChange={setCcStrike}
            pre="$"
            step={0.5}
            ph="Target or manual"
            help="Enter the strike price for the covered call. Usually set above your cost basis."
          />
          <NumField
            label="CC Premium"
            value={ccPremium}
            onChange={setCcPremium}
            pre="$"
            step={0.01}
            ph="1.50"
            note="Market premium"
            help="The premium from your broker's option chain for the call you want to sell."
          />

          {targetCcPremium && desiredRoi && (
            <div style={{ marginTop: 8, padding: 8, background: 'rgba(255,160,80,0.08)', borderRadius: 6 }}>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Target Premium</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#ffa050' }}>{fmtD(targetCcPremium)}</div>
            </div>
          )}
        </Card>
      </div>

      <div>
        <Lbl style={{ marginBottom: 8, display: 'block' }}>Wheel Simulation</Lbl>

        {!wheelResults ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 40 }}>
            Enter stock price, premium, and strike to simulate the wheel
          </div>
        ) : (
          <>
            <Card style={{ 
              marginBottom: 16, 
              background: 'linear-gradient(135deg, rgba(100,80,255,0.08) 0%, rgba(0,180,100,0.05) 100%)',
              border: '1px solid rgba(100,100,255,0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <Lbl style={{ color: 'rgba(255,255,255,0.5)' }}>Wheel Cycle Summary</Lbl>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                    Full cycle: CSP → assigned → CC → stock
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>CSP Yield</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: ACC }}>{fmtPct(wheelResults.cspYieldPct)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>CC Yield</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#ffa050' }}>{fmtPct(wheelResults.ccYieldPct)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Total Cycle</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#a080ff' }}>{fmtPct(wheelResults.totalYieldPct)}</div>
                  </div>
                </div>
              </div>
            </Card>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexDirection: isDesktop ? 'row' : 'column' }}>
              <WheelLeg 
                phase="CSP" 
                stockPrice={stockPrice} 
                strike={effectiveCspStrike} 
                premium={cspPremium} 
                dte={dte}
                result={cspResult}
                isDesktop={isDesktop}
              />
              <WheelLeg 
                phase="CC" 
                stockPrice={stockPrice} 
                strike={ccStrike} 
                premium={effectiveCcPremium} 
                dte={dte}
                result={ccResult}
                isDesktop={isDesktop}
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
              gap: 10
            }}>
              <KV k="CSP Breakeven" v={fmtD(wheelResults.cspBreakeven)} />
              <KV k="CC Breakeven" v={fmtD(wheelResults.ccBreakeven)} />
              <KV k="Avg Cost Basis" v={fmtD(wheelResults.avgCostBasis)} accent />
              <KV k="Total Premium" v={fmtD(wheelResults.totalPremium)} accent />
            </div>

            {cspResult?.bud && ccResult?.bud && (
              <>
                <Sep label="Budget Analysis" />
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)',
                  gap: 10
                }}>
                  <KV k="CSP Contracts" v={cspResult.bud.ctrs} accent />
                  <KV k="Cash Secured" v={fmtD(cspResult.bud.cashUsed)} />
                  <KV k="CSP Income" v={fmtD(cspResult.bud.premTot)} accent />
                  <KV k="Shares if Assigned" v={cspResult.bud.sharesIf} />
                </div>
              </>
            )}

            <Sep />
            <Lbl>Payoff Visualization</Lbl>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
              <Card>
                <Lbl>CSP Payoff</Lbl>
                <PayoffChart
                  sp={sp}
                  strike={parseFloat(effectiveCspStrike) || 0}
                  premium={parseFloat(cspPremium) || 0}
                  type="csp"
                />
              </Card>
              <Card>
                <Lbl>CC Payoff</Lbl>
                <PayoffChart
                  sp={sp}
                  strike={parseFloat(ccStrike) || 0}
                  premium={parseFloat(effectiveCcPremium) || 0}
                  type="cc"
                />
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
