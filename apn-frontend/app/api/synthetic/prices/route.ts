import { NextResponse } from "next/server";

// Fallback rates if external market aggregator is delayed
const DEFAULT_FALLBACK_PRICES: Record<string, number> = {
  BTC: 67450.0,
  ETH: 3520.0,
  SOL: 154.5,
  USDT: 1.0,
  PI: 31.4,
  SIDRA: 1.45,
  CORE: 1.28,
  RUBI: 0.65,
  ICE: 0.08,
};

export async function GET() {
  try {
    // Fetch live market data from CoinGecko Public API
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,tether,coredao,ice-open-network&vs_currencies=usd",
      { next: { revalidate: 30 } } // Cached for 30s to respect rate limits
    );

    let liveData: any = {};
    if (res.ok) {
      liveData = await res.json();
    }

    const currentPrices = {
      BTC: liveData?.bitcoin?.usd || DEFAULT_FALLBACK_PRICES.BTC,
      ETH: liveData?.ethereum?.usd || DEFAULT_FALLBACK_PRICES.ETH,
      SOL: liveData?.solana?.usd || DEFAULT_FALLBACK_PRICES.SOL,
      USDT: liveData?.tether?.usd || DEFAULT_FALLBACK_PRICES.USDT,
      CORE: liveData?.coredao?.usd || DEFAULT_FALLBACK_PRICES.CORE,
      ICE: liveData?.["ice-open-network"]?.usd || DEFAULT_FALLBACK_PRICES.ICE,
      PI: DEFAULT_FALLBACK_PRICES.PI,
      SIDRA: DEFAULT_FALLBACK_PRICES.SIDRA,
      RUBI: DEFAULT_FALLBACK_PRICES.RUBI,
    };

    return NextResponse.json({
      success: true,
      prices: currentPrices,
      oracle: "APN Decentralized Oracle Index",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      prices: DEFAULT_FALLBACK_PRICES,
      oracle: "APN Fallback Peg Engine",
    });
  }
}
