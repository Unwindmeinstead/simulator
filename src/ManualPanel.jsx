import { useState } from 'react'
import { Card, Lbl, ACC } from './ui'

function Section({ title, icon, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.02)', 
      borderRadius: 12, 
      border: `1px solid rgba(255,255,255,0.06)`,
      marginBottom: 16,
      overflow: 'hidden'
    }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          background: isOpen ? 'rgba(0,255,136,0.04)' : 'transparent',
          border: 'none',
          borderBottom: isOpen ? '1px solid rgba(255,255,255,0.04)' : 'none',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'rgba(0,255,136,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
        <span style={{ 
          fontSize: 15, 
          fontWeight: 600, 
          color: '#ffffff',
          flex: 1
        }}>
          {title}
        </span>
        <span style={{ 
          color: 'rgba(255,255,255,0.4)', 
          fontSize: 10,
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </span>
      </button>
      {isOpen && (
        <div style={{ 
          padding: 20, 
          color: 'rgba(255,255,255,0.7)',
          fontSize: 13,
          lineHeight: 1.7
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Definition({ term, desc }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontWeight: 600, color: '#ffffff', fontSize: 13, marginBottom: 4 }}>{term}</div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{desc}</div>
    </div>
  )
}

function Tip({ children }) {
  return (
    <div style={{ 
      background: 'rgba(0,255,136,0.08)', 
      border: '1px solid rgba(0,255,136,0.2)',
      borderRadius: 8,
      padding: '14px 16px',
      marginTop: 16,
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start'
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{children}</div>
    </div>
  )
}

function TabCard({ icon, title, desc, color }) {
  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.03)', 
      padding: 16, 
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,0.06)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ 
          width: 28, 
          height: 28, 
          borderRadius: 6, 
          background: 'rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </div>
        <span style={{ fontWeight: 600, color: color || ACC, fontSize: 14 }}>{title}</span>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{desc}</div>
    </div>
  )
}

const RocketIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
)

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)

const ChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

const SwapIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 16V4M7 4L3 8M7 4l4 4" />
    <path d="M17 8v12m0 0l4-4m-4 4l-4-4" />
  </svg>
)

const BoltIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={ACC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const StrategyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
  </svg>
)

const CallIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffa050" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
)

const PutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12l7 7 7-7" />
  </svg>
)

const BookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0a0ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
)

export default function ManualPanel({ bp }) {
  const isDesktop = bp === 'md' || bp === 'lg' || bp === 'xl'

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <Card style={{ 
        marginBottom: 24, 
        background: 'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(0,100,80,0.08) 100%)',
        border: '1px solid rgba(0,255,136,0.2)',
        textAlign: 'center',
        padding: '28px 20px'
      }}>
        <div style={{ 
          width: 64, 
          height: 64, 
          borderRadius: 16, 
          background: 'rgba(0,255,136,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={ACC} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
          </svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>
          Wheel Strategy Calculator
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
          Complete guide to understanding and using this tool
        </div>
      </Card>

      <Section title="Getting Started" icon={<RocketIcon />} defaultOpen={false}>
        <div style={{ display: 'grid', gap: 10 }}>
          <Definition 
            term="Enter Stock Price" 
            desc="Input the current market price of the stock you want to trade" 
          />
          <Definition 
            term="Set Target ROI" 
            desc="Enter your desired return percentage (typically 5-15% per trade)" 
          />
          <Definition 
            term="View Target Values" 
            desc="The calculator shows you the strike or premium needed to hit your ROI" 
          />
          <Definition 
            term="Analyze Scenarios" 
            desc="Review what happens at different stock prices - both assigned and not assigned" 
          />
        </div>
        <Tip>Start with the Strategy tab to see the full wheel cycle, then explore individual strategies.</Tip>
      </Section>

      <Section title="Understanding Each Tab" icon={<ListIcon />}>
        <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr', gap: 12 }}>
          <TabCard 
            icon={<StrategyIcon />} 
            title="Strategy" 
            color="#00ff88"
            desc="Full wheel cycle simulation. Shows combined results from CSP Assignment CC"
          />
          <TabCard 
            icon={<CallIcon />} 
            title="Call" 
            color="#ffa050"
            desc="Covered Call: Sell calls on stock you own. Collect premium, cap upside potential."
          />
          <TabCard 
            icon={<PutIcon />} 
            title="Put" 
            color="#00ff88"
            desc="Cash Secured Put: Sell puts to collect premium. Get assigned if stock falls below strike."
          />
          <TabCard 
            icon={<BookIcon />} 
            title="Manual" 
            color="#a0a0ff"
            desc="You are in it! This guide explains everything about the wheel strategy."
          />
        </div>
      </Section>

      <Section title="Key Metrics" icon={<ChartIcon />} defaultOpen={false}>
        <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(2, 1fr)' : '1fr', gap: 16 }}>
          <div>
            <Definition 
              term="Premium/Share" 
              desc="Cash received per share (x100 for full contract)" 
            />
            <Definition 
              term="Breakeven" 
              desc="Stock price adjusted for premium received/paid" 
            />
            <Definition 
              term="Yield" 
              desc="Premium divided by stock price x 100" 
            />
          </div>
          <div>
            <Definition 
              term="Annualized Yield" 
              desc="Yield projected to 365 days (accounts for DTE)" 
            />
            <Definition 
              term="ROI if Assigned" 
              desc="Your return if the option is exercised and you get assigned" 
            />
            <Definition 
              term="OTM %" 
              desc="How far out-of-the-money your strike is from current price" 
            />
          </div>
        </div>
      </Section>

      <Section title="The Two Legs Explained" icon={<SwapIcon />} defaultOpen={false}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 600, color: '#ffa050', marginBottom: 8, fontSize: 14 }}>Cash Secured Put (CSP)</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
            <li>You sell a put option and collect premium</li>
            <li>You need cash ready to buy the stock if assigned</li>
            <li>If stock stays above strike, keep premium and repeat</li>
            <li>If stock falls below strike, you buy stock at strike price</li>
          </ul>
        </div>
        <div>
          <div style={{ fontWeight: 600, color: '#00ff88', marginBottom: 8, fontSize: 14 }}>Covered Call (CC)</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
            <li>You own the stock and sell calls against it</li>
            <li>Collect premium from selling the call</li>
            <li>If stock stays below strike, keep premium and repeat</li>
            <li>If stock rises above strike, your shares get called away</li>
          </ul>
        </div>
      </Section>

      <Section title="What Happens When Assigned?" icon={<BoltIcon />} defaultOpen={false}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 16, lineHeight: 1.7 }}>
          The "If Assigned" section shows outcomes at different stock prices:
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 8, borderLeft: '3px solid #ffa050' }}>
            <div style={{ fontWeight: 600, color: '#ffa050', marginBottom: 6 }}>For Puts (CSP)</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              If stock is <strong>below strike</strong> at expiration, you get <strong>assigned</strong> and <strong>buy 100 shares</strong> at strike price. Your cost basis equals strike minus premium received.
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: 14, borderRadius: 8, borderLeft: '3px solid #00ff88' }}>
            <div style={{ fontWeight: 600, color: '#00ff88', marginBottom: 6 }}>For Calls (CC)</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              If stock is <strong>above strike</strong> at expiration, your shares get <strong>called away</strong>. You sell 100 shares at strike price. Your profit equals (strike minus stock price) plus premium received.
            </div>
          </div>
        </div>
        <Tip>The orange-highlighted scenarios indicate assignment. Pay extra attention to these when planning your wheel cycle!</Tip>
      </Section>

      <Section title="Example Walkthrough" icon={<FileIcon />} defaultOpen={false}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: 8 }}>Let us walk through an example:</div>
            <div>Stock ABC trading at <strong style={{ color: '#00ff88' }}>$100</strong>. You want <strong style={{ color: '#00ff88' }}>10% ROI</strong> per trade.</div>
          </div>
          
          <div style={{ background: 'rgba(0,255,136,0.06)', padding: 16, borderRadius: 10, marginBottom: 12, border: '1px solid rgba(0,255,136,0.15)' }}>
            <div style={{ fontWeight: 600, color: '#00ff88', marginBottom: 8 }}>Step 1: Sell CSP</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Enter stock=$100, desired ROI=10%</div>
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <div>Result: <strong style={{ color: '#ffffff' }}>Target Strike = $90.91</strong></div>
              <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.5)' }}>This means sell the $90 strike put to hit 10% ROI</div>
            </div>
          </div>
          
          <div style={{ background: 'rgba(255,160,80,0.06)', padding: 16, borderRadius: 10, marginBottom: 12, border: '1px solid rgba(255,160,80,0.15)' }}>
            <div style={{ fontWeight: 600, color: '#ffa050', marginBottom: 8 }}>Step 2: If Assigned</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Stock falls to $88, you get assigned</div>
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <div>You <strong style={{ color: '#ffffff' }}>buy 100 shares</strong> at $90 strike</div>
              <div>You already collected $10 premium</div>
              <div style={{ marginTop: 4 }}>Your <strong style={{ color: '#ffffff' }}>cost basis: $80/share</strong></div>
            </div>
          </div>
          
          <div style={{ background: 'rgba(0,255,136,0.06)', padding: 16, borderRadius: 10, border: '1px solid rgba(0,255,136,0.15)' }}>
            <div style={{ fontWeight: 600, color: '#00ff88', marginBottom: 8 }}>Step 3: Sell CC</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Now you own stock at $80, sell calls to collect premium</div>
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <div>Enter stock=$80, desired ROI=10%</div>
              <div style={{ marginTop: 4 }}>Result: <strong style={{ color: '#ffffff' }}>Target Premium = $1.47/share</strong></div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Best Practices" icon={<CheckIcon />} defaultOpen={false}>
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 2 }}>
          <li><span style={{ color: '#ffffff' }}>Only trade stocks you want to own</span> - If assigned, you should be happy holding the stock</li>
          <li><span style={{ color: '#ffffff' }}>Set realistic ROI targets</span> - 5-15% per trade is typical</li>
          <li><span style={{ color: '#ffffff' }}>Watch your DTE</span> - 30-45 days is common for the wheel strategy</li>
          <li><span style={{ color: '#ffffff' }}>Be ready to roll</span> - If stock moves against you, consider rolling to next month</li>
          <li><span style={{ color: '#ffffff' }}>Track your cost basis</span> - Each assignment should lower your average cost</li>
        </ol>
        <Tip>This calculator is for educational purposes. Always do your own research before trading options!</Tip>
      </Section>

      <div style={{ textAlign: 'center', padding: '24px 20px', color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
        Not financial advice - For educational purposes only
      </div>
    </div>
  )
}
