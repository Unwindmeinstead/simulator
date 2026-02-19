export function fmt(n, d = 2) {
  if (typeof n !== 'number' || isNaN(n)) return '—'
  return n.toFixed(d)
}

export function fmtD(n) {
  if (typeof n !== 'number' || isNaN(n)) return '—'
  return '$' + fmt(n)
}

export function fmtK(n) {
  if (typeof n !== 'number' || isNaN(n)) return '—'
  if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B'
  if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'
  if (Math.abs(n) >= 1e4) return '$' + (n / 1e3).toFixed(1) + 'k'
  return '$' + fmt(n)
}

export function fmtPct(n) {
  if (typeof n !== 'number' || isNaN(n)) return '—'
  return fmt(n) + '%'
}

export function calcRequiredPremiumCC(stockPrice, strikePrice, desiredRoi) {
  const sp = parseFloat(stockPrice)
  const k = parseFloat(strikePrice)
  const r = parseFloat(desiredRoi) / 100

  if (isNaN(sp) || isNaN(k) || isNaN(r) || sp <= 0 || k <= 0) return null

  const p = (sp * (r + 1) - k) / (r + 1)
  return p > 0 ? p : null
}

export function calcRequiredStrikeCSP(stockPrice, premium, desiredRoi) {
  const sp = parseFloat(stockPrice)
  const p = parseFloat(premium)
  const r = parseFloat(desiredRoi) / 100

  if (isNaN(sp) || isNaN(p) || isNaN(r) || sp <= 0 || p <= 0 || r <= -1) return null

  const k = p + sp / (r + 1)
  return k > 0 ? k : null
}

export function calcCC({ stockPrice, strikePrice, premium, dte, budget }) {
  const sp = parseFloat(stockPrice)
  const k = parseFloat(strikePrice)
  const p = parseFloat(premium)
  const dteVal = parseFloat(dte)
  const budgetVal = parseFloat(budget)

  if (isNaN(sp) || isNaN(k) || isNaN(p) || sp <= 0 || k <= 0 || p <= 0) {
    return null
  }

  const be = sp - p
  const maxProfit = p + (k - sp)
  const prot = (p / sp) * 100
  const otm = ((k - sp) / sp) * 100
  const yieldPct = (p / sp) * 100
  const roiAssigned = (p + (k - sp)) / (sp - p) * 100
  const annualized = dteVal > 0 ? (p / sp) * (365 / dteVal) * 100 : null
  const dailyTheta = dteVal > 0 ? p / dteVal : null

  const scenarioPrices = [sp * 0.70, sp * 0.80, sp * 0.90, sp * 0.95, sp, sp * 1.05, k, sp * 1.10, sp * 1.20, sp * 1.30]
  const scenarioLabels = ['−30%', '−20%', '−10%', '−5%', 'Flat', '+5%', 'Strike', '+10%', '+20%', '+30%']

  const scenarios = scenarioPrices.map((s, i) => {
    const pl = Math.min(maxProfit, p + (s - sp))
    const plPct = (pl / be) * 100
    return { label: scenarioLabels[i], price: s, pl, plPct }
  })

  let bud = null
  if (!isNaN(budgetVal) && budgetVal > 0) {
    const shares = Math.floor(budgetVal / sp)
    const ctrs = Math.floor(shares / 100)
    const sharesUsed = ctrs * 100
    const deployed = sharesUsed * sp
    const leftover = budgetVal - deployed
    const premTot = sharesUsed * p
    const premPerCtr = p * 100
    const costBasis = be
    const annIncome = dteVal > 0 ? (premTot * (365 / dteVal)) / deployed * 100 : null

    bud = {
      ctrs,
      sharesUsed,
      deployed,
      leftover,
      premTot,
      premPerCtr,
      costBasis,
      annIncome
    }
  }

  return {
    be,
    maxProfit,
    prot,
    otm,
    yieldPct,
    roiAssigned,
    annualized,
    dailyTheta,
    scenarios,
    bud
  }
}

export function calcCSP({ stockPrice, strikePrice, premium, dte, budget }) {
  const sp = parseFloat(stockPrice)
  const k = parseFloat(strikePrice)
  const p = parseFloat(premium)
  const dteVal = parseFloat(dte)
  const budgetVal = parseFloat(budget)

  if (isNaN(sp) || isNaN(k) || isNaN(p) || sp <= 0 || k <= 0 || p <= 0) {
    return null
  }

  const be = k - p
  const cashPerCtr = k * 100
  const otm = ((sp - k) / sp) * 100
  const yieldPct = (p / k) * 100
  const roiAssigned = (p - (k - sp)) / (k - p) * 100
  const annualized = dteVal > 0 ? (p / k) * (365 / dteVal) * 100 : null
  const dailyTheta = dteVal > 0 ? p / dteVal : null

  const scenarioPrices = [sp * 0.70, sp * 0.80, sp * 0.90, sp * 0.95, k, sp, sp * 1.05, sp * 1.10, sp * 1.20, sp * 1.30]
  const scenarioLabels = ['−30%', '−20%', '−10%', '−5%', 'Strike', 'Flat', '+5%', '+10%', '+20%', '+30%']

  const scenarios = scenarioPrices.map((s, i) => {
    const pl = p - Math.max(0, k - s)
    const plPct = (pl / be) * 100
    return { label: scenarioLabels[i], price: s, pl, plPct }
  })

  let bud = null
  if (!isNaN(budgetVal) && budgetVal > 0) {
    const ctrs = Math.floor(budgetVal / cashPerCtr)
    const cashUsed = ctrs * cashPerCtr
    const leftover = budgetVal - cashUsed
    const premTot = ctrs * 100 * p
    const sharesIf = ctrs * 100
    const costBasis = be
    const annIncome = dteVal > 0 ? (premTot * (365 / dteVal)) / cashUsed * 100 : null

    bud = {
      ctrs,
      cashUsed,
      leftover,
      premTot,
      sharesIf,
      costBasis,
      annIncome
    }
  }

  return {
    be,
    cashPerCtr,
    otm,
    yieldPct,
    roiAssigned,
    annualized,
    dailyTheta,
    scenarios,
    bud
  }
}
