import React, { useState } from 'react';

function calcCSP({ stockPrice, strikePrice, targetRoi, budget }) {
  const sp = parseFloat(stockPrice);
  const strike = parseFloat(strikePrice);
  const roi = parseFloat(targetRoi) / 100;
  const bud = parseFloat(budget);
  if ([sp, strike, roi].some((v) => isNaN(v) || v <= 0)) return null;
  const cashPerContract = strike * 100;
  const premiumPerShare = roi * strike;
  const premiumPerContract = premiumPerShare * 100;
  const breakeven = strike - premiumPerShare;
  const roiIfAssigned = (premiumPerShare - (strike - sp)) / (strike - premiumPerShare) * 100;
  let budgetResult = null;
  if (!isNaN(bud) && bud > 0) {
    const contracts = Math.floor(bud / cashPerContract);
    const cashUsed = contracts * cashPerContract;
    const cashLeftover = bud - cashUsed;
    const premiumTotal = contracts * premiumPerContract;
    const sharesIfAssigned = contracts * 100;
    budgetResult = { contracts, cashUsed, cashLeftover, premiumTotal, sharesIfAssigned };
  }
  const otmPct = ((sp - strike) / sp) * 100;
  const annualized = null;
  return { breakeven, otmPct, premiumPerShare, premiumPerContract, roiIfAssigned, budgetResult, annualized };
}

export default function CashSecuredPutPanel(){
  const [f, setF] = useState({ stockPrice: '100', strikePrice: '95', targetRoi: '5', budget: '' });
  const set = k => v => setF(p => ({...p, [k]: v}));
  const r = calcCSP(f);
  return (
    <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:20 }}>
      <div style={{ background:'#0b0f15', borderRadius:12, padding:16, border:'1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)', textTransform:'uppercase' }}>Position</div>
        <div style={{ display:'grid', gap:10, marginTop:6 }}>
          <div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)' }}>Stock Price</div>
            <input value={f.stockPrice} onChange={e=>set('stockPrice')(e.target.value)} style={{ width:'100%', padding:8, borderRadius:6, border:'1px solid #333', background:'#111', color:'#fff' }} />
          </div>
          <div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)' }}>Put Strike</div>
            <input value={f.strikePrice} onChange={e=>set('strikePrice')(e.target.value)} style={{ width:'100%', padding:8, borderRadius:6, border:'1px solid #333', background:'#111', color:'#fff' }} />
          </div>
          <div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)' }}>Premium (ROI)</div>
            <input value={f.premium} onChange={e=>set('premium')(e.target.value)} style={{ width:'100%', padding:8, borderRadius:6, border:'1px solid #333', background:'#111', color:'#fff' }} />
          </div>
          <div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)' }}>Days to Exp</div>
            <input value={f.dte} onChange={e=>set('dte')(e.target.value)} style={{ width:'100%', padding:8, borderRadius:6, border:'1px solid #333', background:'#111', color:'#fff' }} />
          </div>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {r ? (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              <div style={{ background:'#0a1d16', padding:16, borderRadius:12, textAlign:'center' }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', textTransform:'uppercase' }}>Premium / Share</div>
                <div style={{ fontSize:20, fontWeight:700 }}>${(parseFloat(f.premium) || 0).toFixed(2)}</div>
              </div>
              <div style={{ background:'#0a1d16', padding:16, borderRadius:12, textAlign:'center' }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', textTransform:'uppercase' }}>Breakeven</div>
                <div style={{ fontSize:20, fontWeight:700 }}>${r.breakeven.toFixed(2)}</div>
              </div>
              <div style={{ background:'#0a1d16', padding:16, borderRadius:12, textAlign:'center' }}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.6)', textTransform:'uppercase' }}>ROI</div>
                <div style={{ fontSize:20, fontWeight:700 }}>{(r.roiIfAssigned ? r.roiIfAssigned : 0).toFixed(2)}%</div>
              </div>
            </div>
            {r.budgetResult && (
              <div style={{ background:'#0b0f15', padding:12, borderRadius:12, border:'1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
                  <div>Contracts: {r.budgetResult.contracts}</div>
                  <div>Premium: ${r.budgetResult.premiumTotal.toFixed(0)}</div>
                  <div>Cash Left: ${r.budgetResult.cashLeftover.toFixed(0)}</div>
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.6)' }}>Payoff at Expiration</div>
              <div style={{ height:120, borderRadius:8, background:'#0a0f14', border:'1px solid rgba(255,255,255,0.08)', padding:8 }}>
                {/* tiny placeholder chart */}
                <span style={{ fontFamily:'monospace', fontSize:12 }}>K: ${f.strikePrice}</span>
              </div>
            </div>
          </>
        ) : (
          <div style={{ padding: 16 }}>Enter inputs</div>
        )}
      </div>
    </div>
  );
}
