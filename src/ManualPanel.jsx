import { useState } from 'react'
import { Card, Lbl, Sep, ACC, GB } from './ui'

function HelpSection({ title, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.02)', 
      borderRadius: 8, 
      border: `1px solid ${GB}`,
      marginBottom: 12,
      overflow: 'hidden'
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <span style={{ 
          fontSize: 14, 
          fontWeight: 700, 
          color: ACC,
          fontFamily: 'JetBrains Mono'
        }}>
          {title}
        </span>
        <span style={{ 
          color: 'rgba(255,255,255,0.4)', 
          fontSize: 12,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div style={{ 
          padding: '0 16px 16px', 
          color: 'rgba(255,255,255,0.7)',
          fontSize: 13,
          lineHeight: 1.6,
          fontFamily: 'JetBrains Mono'
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Step({ num, title, children }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
      <div style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: ACC,
        color: '#08090b',
        fontSize: 12,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {num}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: '#e8e8e8', marginBottom: 4 }}>{title}</div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{children}</div>
      </div>
    </div>
  )
}

function Tip({ children }) {
  return (
    <div style={{ 
      background: 'rgba(0,224,122,0.06)', 
      border: '1px solid rgba(0,224,122,0.2)',
      borderRadius: 6,
      padding: '10px 12px',
      marginTop: 12,
      fontSize: 12
    }}>
      <span style={{ color: ACC, fontWeight: 700 }}>💡 Tip: </span>
      {children}
    </div>
  )
}

export default function ManualPanel({ bp }) {
  const isDesktop = bp === 'md' || bp === 'lg' || bp === 'xl'

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card style={{ marginBottom: 20, background: 'linear-gradient(135deg, rgba(0,224,122,0.08) 0%, rgba(0,100,150,0.05) 100%)' }}>
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
          <Lbl style={{ color: ACC, fontSize: 11 }}>Wheel Strategy Calculator</Lbl>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>
            Complete guide to using this options calculator
          </div>
        </div>
      </Card>

      <HelpSection title="What is the Wheel Strategy?">
        <p style={{ marginTop: 0 }}>
          The <strong>Wheel Strategy</strong> is a systematic options trading approach that generates income while potentially acquiring stocks at favorable prices. It combines two strategies:
        </p>
        <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
          <li><strong>Cash Secured Put (CSP)</strong> - Sell puts to collect premium</li>
          <li><strong>Covered Call (CC)</strong> - Sell calls on owned stock</li>
        </ul>
        <p>
          The strategy cycles between these two positions, collecting premiums while waiting for assignment.
        </p>
      </HelpSection>

      <HelpSection title="Quick Start Guide">
        <Step num="1" title="Enter Stock Price">
          Input the current stock price you're interested in trading.
        </Step>
        <Step num="2" title="Set Your Desired ROI">
          Enter the return percentage you want to earn from each options trade.
        </Step>
        <Step num="3" title="Get Target Values">
          The calculator automatically shows:
          <ul style={{ paddingLeft: 16, marginTop: 6 }}>
            <li><strong>CSP:</strong> What strike price you need to hit your ROI</li>
            <li><strong>CC:</strong> What premium you need to collect</li>
          </ul>
        </Step>
        <Step num="4" title="Analyze Scenarios">
          Review the "If Assigned" section to see what happens at different stock prices.
        </Step>
        <Tip>
          Start with the Wheel tab to see the full cycle simulation, then explore individual strategies in Covered Call or Cash Secured Put tabs.
        </Tip>
      </HelpSection>

      <HelpSection title="Understanding the Tabs">
        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 6 }}>
            <div style={{ fontWeight: 700, color: ACC, marginBottom: 4 }}>⚙ Wheel Tab</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              Simulates a complete wheel cycle: CSP → Assignment → CC → Repeat. Shows combined yields from both legs.
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 6 }}>
            <div style={{ fontWeight: 700, color: '#ffa050', marginBottom: 4 }}>↑ Covered Call Tab</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              Sell calls against stock you own. Collect premium, cap upside. Use when you're okay selling at your strike price.
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 6 }}>
            <div style={{ fontWeight: 700, color: ACC, marginBottom: 4 }}>↓ Cash Secured Put Tab</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              Sell puts while holding cash. Get assigned if stock falls below strike. Use to acquire stock at a discount.
            </div>
          </div>
        </div>
      </HelpSection>

      <HelpSection title="Key Metrics Explained">
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 4 }}>
              <div style={{ fontSize: 11, color: ACC, fontWeight: 700 }}>Premium/Share</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Cash received per share</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 4 }}>
              <div style={{ fontSize: 11, color: ACC, fontWeight: 700 }}>Breakeven</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Stock price + premium paid/received</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 4 }}>
              <div style={{ fontSize: 11, color: ACC, fontWeight: 700 }}>Yield</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Premium ÷ stock price × 100</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 4 }}>
              <div style={{ fontSize: 11, color: ACC, fontWeight: 700 }}>Annualized Yield</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Yield projected to 365 days</div>
            </div>
          </div>
        </div>
        <ul style={{ fontSize: 12, paddingLeft: 16 }}>
          <li><strong>ROI if Assigned</strong> - Your return if the option is exercised</li>
          <li><strong>OTM %</strong> - How far out-of-the-money your strike is</li>
          <li><strong>Daily Theta</strong> - How much value decays per day</li>
        </ul>
      </HelpSection>

      <HelpSection title='The "If Assigned" Section'>
        <p style={{ marginTop: 12 }}>
          This section shows exactly what happens if your option gets exercised:
        </p>
        <ul style={{ fontSize: 12, paddingLeft: 16 }}>
          <li><strong>CSP:</strong> If stock is below strike at expiration, you get assigned and buy the stock</li>
          <li><strong>CC:</strong> If stock is above strike at expiration, your shares get called away</li>
        </ul>
        <p style={{ fontSize: 12 }}>
          Each scenario shows the stock price, whether you'd be assigned, and your profit/loss per share.
        </p>
        <Tip>
          The orange-highlighted scenarios indicate assignment - pay extra attention to these when planning your wheel cycle!
        </Tip>
      </HelpSection>

      <HelpSection title="Example: Running the Wheel">
        <div style={{ marginTop: 12, fontSize: 12 }}>
          <p>Let's say stock ABC is at <strong>$100</strong> and you want <strong>10% ROI</strong>:</p>
          
          <div style={{ background: 'rgba(0,224,122,0.05)', padding: 12, borderRadius: 6, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, color: ACC, marginBottom: 6 }}>Step 1: Sell CSP</div>
            <div>Enter stock=$100, premium=$2.00, desired ROI=10%</div>
            <div style={{ marginTop: 6 }}>Result: Target strike = <strong>$90.91</strong></div>
            <div>This means you need to sell the $90 strike put to hit 10% ROI</div>
          </div>
          
          <div style={{ background: 'rgba(255,160,80,0.05)', padding: 12, borderRadius: 6, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, color: '#ffa050', marginBottom: 6 }}>Step 2: If Assigned</div>
            <div>Stock falls to $88 → You get assigned</div>
            <div>You buy 100 shares at $90 (strike), already collected $2 premium</div>
            <div style={{ marginTop: 6 }}>Your cost basis: <strong>$88/share</strong></div>
          </div>
          
          <div style={{ background: 'rgba(0,224,122,0.05)', padding: 12, borderRadius: 6 }}>
            <div style={{ fontWeight: 700, color: ACC, marginBottom: 6 }}>Step 3: Sell CC</div>
            <div>Now you own stock at $88, sell calls to continue collecting premium</div>
            <div>Enter stock=$88, desired ROI=10%</div>
            <div style={{ marginTop: 6 }}>Result: Target premium = <strong>$1.47/share</strong></div>
          </div>
        </div>
      </HelpSection>

      <HelpSection title="Budget & Position Sizing">
        <p style={{ marginTop: 12 }}>
          The calculator helps you understand how many contracts you can trade:
        </p>
        <ul style={{ fontSize: 12, paddingLeft: 16 }}>
          <li><strong>For CSP:</strong> Each contract requires $100 × strike in cash as collateral</li>
          <li><strong>For CC:</strong> Each contract requires 100 shares of stock</li>
          <li><strong>Budget leftover:</strong> Cash not used (shown in orange if significant)</li>
        </ul>
        <Tip>
          Always keep extra cash reserved! The calculator shows leftover but you may want a buffer for margin calls or price fluctuations.
        </Tip>
      </HelpSection>

      <HelpSection title="Best Practices">
        <ol style={{ fontSize: 12, paddingLeft: 16, lineHeight: 1.8 }}>
          <li><strong>Start with stocks you want to own</strong> - If assigned, you should be happy holding the stock</li>
          <li><strong>Set realistic ROI targets</strong> - 5-15% per trade is typical</li>
          <li><strong>Watch DTE (Days to Expiration)</strong> - 30-45 days is common for the wheel</li>
          <li><strong>Roll if needed</strong> - If stock moves against you, consider rolling to next month</li>
          <li><strong>Track your cost basis</strong> - Each assignment should lower your average cost</li>
        </ol>
        <Tip>
          This calculator is for educational purposes. Always do your own research before trading options!
        </Tip>
      </HelpSection>

      <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
        Not financial advice • For educational purposes only
      </div>
    </div>
  )
}
