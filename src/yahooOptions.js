// Lightweight Yahoo Finance options fetcher (unofficial API)
// Note: Public Yahoo endpoints are not official APIs and may change or block CORS.
// This utility fetches option chains for a given symbol and returns raw data.
export async function fetchYahooOptions(symbol = "AAPL") {
  const url = `https://query1.finance.yahoo.com/v7/finance/options/${encodeURIComponent(symbol)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Yahoo options fetch failed: ${res.status}`);
  }
  const json = await res.json();
  // Normalize to a safe structure: [{ date, calls: [...], puts: [...] }]
  const data = json?.optionChain?.result?.[0]?.options;
  return data || [];
}
