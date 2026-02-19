# Options Trading Simulator

A comprehensive options trading calculator for covered calls and cash secured puts. This tool helps you analyze potential returns, breakeven points, and risk scenarios for options trading strategies.

## Features

- **Covered Call Calculator**: Calculate returns, breakeven points, and ROI for covered call strategies
- **Cash Secured Put Calculator**: Analyze cash secured put strategies with yield calculations
- **Interactive Payoff Charts**: Visual representation of potential profits/losses at expiration
- **Scenario Analysis**: See performance under different market conditions (-20%, -10%, flat, strike, +10%)
- **Budget Planning**: Calculate contract allocation based on available capital
- **Real-time Calculations**: Instant updates as you adjust parameters

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Unwindmeinstead/simulator.git
cd simulator
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## Usage

### Covered Call Strategy
- Enter the current stock price
- Set your desired call strike price
- Input the premium (bid/ask midpoint)
- Specify days to expiration (DTE)
- Optionally set a budget for position sizing

### Cash Secured Put Strategy
- Enter the current stock price
- Set your desired put strike price
- Input the premium received
- Specify days to expiration (DTE)
- Optionally set a budget for position sizing

## Key Metrics Explained

- **Breakeven**: Price point where the strategy becomes profitable
- **Max Profit**: Maximum potential gain per share
- **Annualized Yield**: Return projected over one year
- **ROI**: Return on investment if assigned
- **Daily Theta**: Estimated premium decay per day

## Disclaimer

This tool is for educational and informational purposes only. It is not financial advice. Options trading involves significant risk and may not be suitable for all investors. Always consult with a qualified financial advisor before making investment decisions.

## Technologies Used

- React 18
- React Scripts
- Modern CSS with custom styling
- SVG for interactive charts

## License

MIT License - see LICENSE file for details
