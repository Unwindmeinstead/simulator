import { useState, useMemo } from 'react'
import { calcCSP, calcRequiredStrikeCSP, fmtD, fmtPct } from './math'
import { NumField, Card, KV, Sep, Badge, Lbl, ACC, GB, G } from './ui'
import ScenarioTable from './ScenarioTable'
import PayoffChart from './PayoffChart'

function AssignedScenario({ label, price, premium, strike, isAssigned }) {
  const pl = isAssigned ? (premium - Math.max(0, strike - price)) : premium
  const isProfit = pl >= 0
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '10px 12px',
      background: isAssigned ? 'rgba(255,160,80,0.08)' : 'rgba(255,255,255,0.02)',
      borderRadius: 6,
      border: isAssigned ? '1px solid rgba(255,160,80,0.2)' : '1px solid rgba(255,255,255,0.05)'
    }}>
      <div>
        <div style={{ fontSize: 11, color: isAssigned ? '#ffa050' : 'rgba(255,255,255,0.5)' }}>
          {label}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>
          {fmtD(price)}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
          {isAssigned ? 'ASSIGNED' : 'Not assigned'}
        </div>
        <div style={{ 
          fontSize: 14, 
          fontWeight: 700, 
          color: isProfit ? ACC : '#e05050',
          marginTop: 2
        }}>
          {isProfit ? '+' : ''}{fmtD(pl)}/sh
        </div>
      </div>
    </div>
  )
}

export default function CSPanel({ bp }) {
  const [stockPrice, setStockPrice] = useState('')
  const [strikePrice, setStrikePrice] = useState('')
  const [premium, setPremium] = useState('')
  const [dte, setDte] = useState('')
  const [budget, setBudget] = useState('')
  const [desiredRoi, setDesiredRoi] = useState('')

  const sp = parseFloat(stockPrice) || 0
  const k = parseFloat(strikePrice) || 0
  const pVal = parseFloat(premium) || 0

  const requiredStrike = useMemo(() => {
    if (!stockPrice || !premium || !desiredRoi) return null
    return calcRequiredStrikeCSP(stockPrice, premium, desiredRoi)
  }, [stockPrice, premium, desiredRoi])

  const effectiveStrike = requiredStrike || strikePrice
  const hasTarget = requiredStrike && desiredRoi && premium

  const result = useMemo(() => {
    if (!stockPrice || !effectiveStrike || !premium) return null
    return calcCSP({ stockPrice, strikePrice: effectiveStrike, premium, dte, budget })
  }, [stockPrice, effectiveStrike, premium, dte, budget])

  const assignedScenarios = useMemo(() => {
    if (!sp || !k || !pVal) return []
    
    return [
      { label: 'Below strike -20%', price: k * 0.80, isAssigned: true },
      { label: 'Below strike -10%', price: k * 0.90, isAssigned: true },
      { label: 'At strike (K)', price: k, isAssigned: true },
      { label: 'Above strike +5%', price: k * 1.05, isAssigned: false },
      { label: 'Above strike +10%', price: k * 1.10, isAssigned: false },
    ].map(s => ({
      ...s,
      pl: s.isAssigned ? (pVal - Math.max(0, k - s.price)) : pVal,
      roi: s.isAssigned ? ((pVal - Math.max(0, k - s.price)) / (k - pVal) * 100) : (pVal / k * 100)
    }))
  }, [sp, k, pVal])

  const isDesktop = bp === 'md' || bp === 'lg' || bp === 'xl'

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isDesktop ? '280px 1fr' : '1fr',
      gap: isDesktop ? 28 : 16
    }}>
      <div>
        <Card>
          <Lbl style={{ marginBottom: 12, display: 'block', color: ACC, fontSize: 11 }}>Cash Secured Put Strategy</Lbl>

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
            label="Premium Available"
            value={premium}
            onChange={setPremium}
            pre="$"
            step={0.01}
            ph="2.00"
            note="Bid/ask midpoint"
            help="The premium (bid+ask)/2 from your broker's option chain. This is what you collect for selling the put."
          />
          <NumField
            label="Desired ROI"
            value={desiredRoi}
            onChange={setDesiredRoi}
            suf="%"
            step={1}
            ph="10"
            note="Your target return %"
            help="The return percentage you want to earn. The calculator will show what strike you need to hit this target."
          />

          {requiredStrike && desiredRoi && (
            <div style={{ marginTop: 12 }}>
              <Card accent style={{ background: 'rgba(0,224,122,0.08)', border: '1px solid rgba(0,224,122,0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>🎯</span>
                  <Lbl style={{ margin: 0 }}>Target Strike Price</Lbl>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: ACC, marginTop: 2 }}>
                  {fmtD(requiredStrike)}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
                  {fmtD(requiredStrike * 100)} cash secured per contract
                </div>
              </Card>
            </div>
          )}

          <Sep label="Optional" />

          <NumField
            label="Target Strike (override)"
            value={strikePrice}
            onChange={setStrikePrice}
            pre="$"
            step={0.5}
            ph="95.00"
            note="Use if not using Desired ROI"
            help="Manually enter a strike price if you don't want to use the calculated target strike."
          />
          
          <NumField
            label="Days to Expiration"
            value={dte}
            onChange={setDte}
            suf="DTE"
            step={1}
            ph="30"
            help="Days until option expires. 30-45 days is typical for wheel strategy. Affects annualized yield calculations."
          />
          <NumField
            label="Budget"
            value={budget}
            onChange={setBudget}
            pre="$"
            step={1000}
            ph="optional"
            help="Total capital available. Each contract requires strike × $100 as collateral."
          />

          {result && (
            <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <Badge label="OTM" value={fmtPct(Math.abs(result.otm))} pos={result.otm >= 0} />
              <Badge label="Yield" value={fmtPct(result.yieldPct)} pos={true} />
              <Badge label="Cash/Ctr" value={fmtD(result.cashPerCtr)} neutral />
              {result.annualized && <Badge label="Ann." value={fmtPct(result.annualized)} pos={true} />}
            </div>
          )}
        </Card>
      </div>

      <div>
        {result && (
          <Card style={{ marginBottom: 16, background: 'linear-gradient(135deg, rgba(0,224,122,0.06) 0%, rgba(0,180,100,0.03) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <Lbl style={{ color: 'rgba(255,255,255,0.5)' }}>Strategy Summary</Lbl>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                  Sell {effectiveStrike && fmtD(effectiveStrike)} put on {stockPrice && fmtD(stockPrice)} stock
                  {hasTarget && !strikePrice && <span style={{ color: ACC, marginLeft: 8 }}>• Using target strike</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Max Return</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: ACC }}>{fmtPct(result.yieldPct)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Breakeven</div>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{fmtD(result.be)}</div>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Lbl style={{ marginBottom: 8, display: 'block' }}>Key Metrics</Lbl>

        {!result ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: 40 }}>
            Enter stock price, premium, and desired ROI to see analysis
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
              gap: 10
            }}>
              <KV k="Premium/Share" v={fmtD(premium)} accent big />
              <KV k="Breakeven" v={fmtD(result.be)} sub={`${fmtD(result.cashPerCtr)} collateral`} />
              <KV k="Cash/Contract" v={fmtD(result.cashPerCtr)} />
              <KV k="ROI if Assigned" v={fmtPct(result.roiAssigned)} />
              {result.annualized && <KV k="Ann. Yield" v={fmtPct(result.annualized)} />}
              {result.dailyTheta && <KV k="Daily Theta" v={fmtD(result.dailyTheta)} />}
            </div>

            <Sep label="If Assigned Simulation" />
            
            <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
              {assignedScenarios.map((s, i) => (
                <AssignedScenario 
                  key={i}
                  label={s.label}
                  price={s.price}
                  premium={pVal}
                  strike={k}
                  isAssigned={s.isAssigned}
                />
              ))}
            </div>

            {result.bud && (
              <>
                <Sep label="Budget Allocation" />
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isDesktop ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                  gap: 10
                }}>
                  <KV k="Contracts" v={result.bud.ctrs} accent big />
                  <KV k="Cash Secured" v={fmtD(result.bud.cashUsed)} />
                  <KV k="Cash Leftover" v={fmtD(result.bud.leftover)} warn={result.bud.leftover > 0} />
                  <KV k="Shares if Assigned" v={result.bud.sharesIf} />
                  <KV k="Premium Income" v={fmtD(result.bud.premTot)} accent />
                  <KV k="Cost Basis" v={fmtD(result.bud.costBasis)} />
                  {result.bud.annIncome && <KV k="Ann. Income" v={fmtPct(result.bud.annIncome)} />}
                </div>
              </>
            )}

            <Sep />
            <Lbl>Scenario Analysis</Lbl>
            <div style={{ marginTop: 10 }}>
              <ScenarioTable scenarios={result.scenarios} targetRoi={parseFloat(desiredRoi)} />
            </div>

            <Card style={{ marginTop: 16 }}>
              <Lbl>Payoff Diagram</Lbl>
              <PayoffChart
                sp={sp}
                strike={k}
                premium={pVal}
                type="csp"
              />
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
