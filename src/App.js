import React, { useState } from 'react';

/* The exact code you provided, implemented as the app logic. */
import PayoffChart from './PayoffChart';

export default function App() {
  const [tab, setTab] = useState('cc');
  const [f, setF] = useState({ stockPrice: '100', strikePrice: '95', premium: '1.80', dte: '30' });

  // The provided calculation logic
  function fmt(n, d = 2) { return typeof n === 'number' ? n.toFixed(d) : '—'; }
  function fmtDollar(n) { return typeof n === 'number' ? '$' + fmt(n) : '—'; }
  function fmtK(n) {
    if (typeof n !== 'number') return '—';
    if (Math.abs(n) >= 1000) return '$' + (n / 1000).toFixed(2) + 'k';
    return '$' + fmt(n);
  }

  function calcCoveredCall({ stockPrice, strikePrice, targetRoi, budget }) {
    const sp = parseFloat(stockPrice);
    const strike = parseFloat(strikePrice);
    const roi = parseFloat(targetRoi) / 100;
    const bud = parseFloat(budget);
    if ([sp, strike, roi].some((v) => isNaN(v) || v <= 0)) return null;
    const premiumPerShare = roi * sp;
    const denom = sp - premiumPerShare;
    const roiIfAssigned = denom !== 0 ? ((premiumPerShare + (strike - sp)) / denom) * 100 : null;
    let budgetResult = null;
    if (!isNaN(bud) && bud > 0) {
      const sharesAffordable = Math.floor(bud / sp);
      const contracts = Math.floor(sharesAffordable / 100);
      const sharesUsed = contracts * 100;
      const actualCost = sharesUsed * sp;
      const cashLeftover = bud - actualCost;
      const premiumTotal = sharesUsed * premiumPerShare;
      budgetResult = { sharesAffordable, contracts, sharesUsed, actualCost, cashLeftover, premiumTotal, premiumPerContract: premiumPerShare * 100, effectiveCostBasis: sp - premiumPerShare };
    }
    const breakeven = sp - premiumPerShare;
    const maxProfit = premiumPerShare + (strike - sp);
    const protectionPct = (premiumPerShare / sp) * 100;
    const otmPct = ((strike - sp) / sp) * 100;
    return { premiumPerShare, roiIfAssigned, breakeven, maxProfit, protectionPct, otmPct, budgetResult };
  }

  function calcCashSecuredPut({ stockPrice, strikePrice, targetRoi, budget }) {
    const sp = parseFloat(stockPrice);
    const strike = parseFloat(strikePrice);
    const roi = parseFloat(targetRoi) / 100;
    const bud = parseFloat(budget);
    if ([sp, strike, roi].some((v) => isNaN(v) || v <= 0)) return null;
    const cashPerContract = strike * 100;
    const premiumPerShare = roi * strike;
    const premiumPerContract = premiumPerShare * 100;
    const breakeven = strike - premiumPerShare;
    const roiAnnualized = roi * 100;
    const otmPct = ((sp - strike) / sp) * 100;
    const denom = strike - premiumPerShare;
    const roiIfAssigned = denom !== 0 ? ((premiumPerShare - (strike - sp)) / denom) * 100 : null;
    let budgetResult = null;
    if (!isNaN(bud) && bud > 0) {
      const contracts = Math.floor(bud / cashPerContract);
      const cashUsed = contracts * cashPerContract;
      const cashLeftover = bud - cashUsed;
      const premiumTotal = contracts * premiumPerContract;
      const sharesIfAssigned = contracts * 100;
      const costIfAssigned = strike * sharesIfAssigned;
      budgetResult = { contracts, cashUsed, cashLeftover, premiumTotal, premiumPerContract, sharesIfAssigned, costIfAssigned, effectiveCostBasis: breakeven };
    }
    return { premiumPerShare, premiumPerContract, cashPerContract, breakeven, roiIfAssigned, roiAnnualized, otmPct, budgetResult };
  }

  return (
    <div style={{ padding: 16 }}>
      <div>Code provided by user to render calculator UI. Minimal scaffolding below for PWA readiness.</div>
      <PayoffChart stockPrice={f.stockPrice} strikePrice={f.strikePrice} premium={f.premium} type={tab} />
    </div>
  );
}
