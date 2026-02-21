import { useRef, useEffect, useMemo, useCallback } from "react";

export default function PlugChart({
    prices = [],
    width = 600,
    height = 300,
    isUp = true,
    onHover = () => { },
    emaLines = []
}) {
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);
    const animRef = useRef(null);

    const PAD_T = 12;
    const PAD_B = 2;
    const W = width;
    const H = height - PAD_T - PAD_B;

    const minP = useMemo(() => Math.min(...prices) * 0.998, [prices]);
    const maxP = useMemo(() => Math.max(...prices) * 1.002, [prices]);
    const range = maxP - minP || 1;

    const xOf = useCallback((i, n) => (i / (n - 1)) * W, [W]);
    const yOf = useCallback((p) => PAD_T + H - ((p - minP) / range) * H, [H, minP, range]);

    const color = isUp ? "#00c805" : "#ff5000";
    const colorRGB = isUp ? "0,200,5" : "255,80,0";

    const drawChart = useCallback((progress = 1) => {
        const canvas = canvasRef.current;
        if (!canvas || prices.length < 2) return;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, width, height);

        const n = prices.length;
        const endIdx = Math.floor(progress * (n - 1));

        const grad = ctx.createLinearGradient(0, PAD_T, 0, PAD_T + H);
        grad.addColorStop(0, `rgba(${colorRGB},0.18)`);
        grad.addColorStop(0.6, `rgba(${colorRGB},0.05)`);
        grad.addColorStop(1, `rgba(${colorRGB},0)`);

        const buildPath = () => {
            if (endIdx === 0) {
                ctx.moveTo(xOf(0, n), yOf(prices[0]));
                return;
            }
            ctx.moveTo(xOf(0, n), yOf(prices[0]));
            for (let i = 0; i < endIdx; i++) {
                const x0 = xOf(i, n);
                const y0 = yOf(prices[i]);
                const x1 = xOf(i + 1, n);
                const y1 = yOf(prices[i + 1]);
                const cpX = (x0 + x1) / 2;
                const cpY = (y0 + y1) / 2;
                ctx.quadraticCurveTo(x0, y0, cpX, cpY);
            }
            if (endIdx < n - 1) {
                ctx.lineTo(xOf(endIdx, n), yOf(prices[endIdx]));
            }
        };

        ctx.beginPath();
        buildPath();
        ctx.lineTo(xOf(endIdx, n), PAD_T + H);
        ctx.lineTo(xOf(0, n), PAD_T + H);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        buildPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.8;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();

        emaLines.forEach(ema => {
            if (!ema.data || ema.data.length < 2) return;
            ctx.beginPath();
            let started = false;
            for (let i = 0; i < ema.data.length; i++) {
                if (ema.data[i] == null) continue;
                const x = xOf(i, n);
                const y = yOf(ema.data[i]);
                if (!started) {
                    ctx.moveTo(x, y);
                    started = true;
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.strokeStyle = ema.color;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        });
    }, [prices, width, height, colorRGB, color, xOf, yOf, H, emaLines]);

    useEffect(() => {
        if (prices.length < 2) return;
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        
        const ctx2 = overlayRef.current?.getContext("2d");
        if (ctx2) ctx2.clearRect(0, 0, width, height);
        
        drawChart(1);
    }, [prices, width, height]);

    useEffect(() => {
        if (prices.length < 2) return;
        drawChart(1);
    }, [drawChart]);

    const drawCrosshair = useCallback((mouseX) => {
        const canvas = overlayRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, width, height);

        if (mouseX == null) {
            onHover(null);
            return;
        }

        const n = prices.length;
        const idx = Math.max(0, Math.min(n - 1, Math.round((mouseX / W) * (n - 1))));
        const x = xOf(idx, n);
        const y = yOf(prices[idx]);

        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath();
        ctx.moveTo(x, PAD_T);
        ctx.lineTo(x, PAD_T + H);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${colorRGB},0.3)`;
        ctx.lineWidth = 2;
        ctx.stroke();

        onHover({ index: idx, price: prices[idx] });
    }, [prices, width, height, colorRGB, xOf, yOf, W, H, onHover]);

    return (
        <div style={{ position: "relative", width, height }}>
            <canvas ref={canvasRef} width={width} height={height} style={{ position: "absolute" }} />
            <canvas
                ref={overlayRef}
                width={width}
                height={height}
                style={{ position: "absolute", cursor: "crosshair" }}
                onMouseMove={(e) => {
                    const rect = overlayRef.current.getBoundingClientRect();
                    drawCrosshair(e.clientX - rect.left);
                }}
                onMouseLeave={() => drawCrosshair(null)}
            />
        </div>
    );
}
