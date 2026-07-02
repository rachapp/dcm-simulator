import React, { useMemo, useState, useRef } from 'react';
import { X, Info, ZoomIn, ZoomOut, RotateCcw, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '../utils';
import { HC } from '../engine';

// Publication-grade nice ticks helper (multiples of 1, 2, 5, 10, etc.)
const calculateNiceTicks = (min, max, maxTicks = 4) => {
  const range = max - min;
  if (range <= 0) return [min];
  
  const rawSpacing = range / (maxTicks - 1);
  const logBase10 = Math.log10(rawSpacing);
  const powerOfTen = Math.pow(10, Math.floor(logBase10));
  const fraction = rawSpacing / powerOfTen;
  
  let niceFraction = 1;
  if (fraction < 1.5) niceFraction = 1;
  else if (fraction < 3.0) niceFraction = 2;
  else if (fraction < 7.0) niceFraction = 5;
  else niceFraction = 10;
  
  const spacing = niceFraction * powerOfTen;
  
  const firstTick = Math.ceil(min / spacing) * spacing;
  const ticks = [];
  for (let t = firstTick; t <= max + 0.0001; t += spacing) {
    ticks.push(Number(t.toPrecision(10)));
  }
  
  if (ticks.length < 2) {
    return [min, max];
  }
  return ticks;
};

// Publication-grade SVG Line Chart with mouse hover coordinate reading
const SvgLineChart = ({ title, data, xLabel, yLabel, currentIdx, isLightMode }) => {
  const points = data;
  const svgRef = useRef(null);
  const [zoom, setZoom] = useState(1.0);
  const [panOffsetX, setPanOffsetX] = useState(0);
  const [panOffsetY, setPanOffsetY] = useState(0);
  const [hoverPoint, setHoverPoint] = useState(null);

  if (!points || points.length === 0) return null;

  // Base min/max bounds of the dataset
  const xValues = points.map(p => p.x);
  const yValues = points.map(p => p.y);
  
  const baseMinX = Math.min(...xValues);
  const baseMaxX = Math.max(...xValues);
  const baseMinY = Math.min(...yValues);
  const baseMaxY = Math.max(...yValues);

  const baseDx = baseMaxX - baseMinX || 1;
  const baseDy = baseMaxY - baseMinY || 1;

  // Standard padding
  const basePadY = baseDy * 0.1;
  const baseChartMinY = baseMinY - basePadY;
  const baseChartMaxY = baseMaxY + basePadY;
  const baseChartDy = baseChartMaxY - baseChartMinY;

  // Zoomed and panned boundaries
  const centerX = (baseMinX + baseMaxX) / 2;
  const centerY = (baseChartMinY + baseChartMaxY) / 2;

  const currentRangeX = baseDx / zoom;
  const currentRangeY = baseChartDy / zoom;

  const minX = centerX - currentRangeX / 2 + panOffsetX;
  const maxX = centerX + currentRangeX / 2 + panOffsetX;
  const minY = centerY - currentRangeY / 2 + panOffsetY;
  const maxY = centerY + currentRangeY / 2 + panOffsetY;

  const dx = maxX - minX || 1;
  const dy = maxY - minY || 1;

  // SVG dimensions (58px left padding for clean Y-axis labels and tick numbers)
  const width = 360;
  const height = 190;
  const paddingLeft = 58;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 32;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const toScreenX = (x) => paddingLeft + ((x - minX) / dx) * chartWidth;
  const toScreenY = (y) => height - paddingBottom - ((y - minY) / dy) * chartHeight;

  // Nice ticks calculation
  const xTicksRaw = useMemo(() => calculateNiceTicks(minX, maxX, 5), [minX, maxX]);
  const yTicksRaw = useMemo(() => calculateNiceTicks(minY, maxY, 4), [minY, maxY]);

  const xTicks = xTicksRaw.filter(t => t >= minX && t <= maxX);
  const yTicks = yTicksRaw.filter(t => t >= minY && t <= maxY);

  const currentPoint = currentIdx >= 0 && currentIdx < points.length ? points[currentIdx] : null;

  // Filter visible points to prevent SVG rendering artifacts outside graph frame
  const visiblePoints = points.filter(p => p.x >= minX - baseDx * 0.05 && p.x <= maxX + baseDx * 0.05);

  const pathData = visiblePoints
    .map(p => `${toScreenX(p.x)},${toScreenY(p.y)}`)
    .join(' ');

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.3, 10));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.3, 0.5));
  const handleReset = () => {
    setZoom(1.0);
    setPanOffsetX(0);
    setPanOffsetY(0);
  };

  const pan = (dirX, dirY) => {
    const shiftStepX = (baseDx / zoom) * 0.15;
    const shiftStepY = (baseChartDy / zoom) * 0.15;
    setPanOffsetX(prev => prev + dirX * shiftStepX);
    setPanOffsetY(prev => prev + dirY * shiftStepY);
  };

  // Convert mouse coordinate back to step index for precise reading
  const handleMouseMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    
    // Position of mouse inside the SVG viewBox coordinates
    const mouseSvgX = ((e.clientX - rect.left) / rect.width) * width;
    
    // Inverse projection to discover data X
    const dataX = minX + ((mouseSvgX - paddingLeft) / chartWidth) * dx;
    
    // Clamp to valid range and round to nearest discrete step index
    const nearestStep = Math.max(baseMinX, Math.min(baseMaxX, Math.round(dataX)));
    const p = points.find(pt => pt.x === nearestStep);
    
    if (p) {
      setHoverPoint({
        x: p.x,
        y: p.y,
        screenX: toScreenX(p.x),
        screenY: toScreenY(p.y)
      });
    }
  };

  const handleMouseLeave = () => {
    setHoverPoint(null);
  };

  return (
    <div className={cn(
      "border rounded-lg p-2.5 flex flex-col gap-1 shadow-sm transition-colors duration-300 relative h-full min-h-0",
      isLightMode ? "bg-white border-gray-200" : "bg-zinc-950 border-zinc-800"
    )}>
      <div className="flex justify-between items-center z-10 shrink-0">
        <span className={cn("text-[10px] font-bold uppercase tracking-wider", isLightMode ? "text-gray-600" : "text-gray-400")}>
          {title}
        </span>
        {/* Compact View Controller */}
        <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
          <button
            onClick={() => pan(-1, 0)}
            title="Pan Left"
            className={cn("p-0.5 rounded text-[8px] border font-bold cursor-pointer", isLightMode ? "bg-gray-50 hover:bg-gray-100 border-gray-200" : "bg-zinc-900 hover:bg-zinc-850 border-zinc-800")}
          >
            ←
          </button>
          <button
            onClick={() => pan(1, 0)}
            title="Pan Right"
            className={cn("p-0.5 rounded text-[8px] border font-bold cursor-pointer", isLightMode ? "bg-gray-50 hover:bg-gray-100 border-gray-200" : "bg-zinc-900 hover:bg-zinc-850 border-zinc-800")}
          >
            →
          </button>
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className={cn("p-0.5 rounded border cursor-pointer", isLightMode ? "bg-gray-50 hover:bg-gray-100 border-gray-200" : "bg-zinc-900 hover:bg-zinc-850 border-zinc-800")}
          >
            <ZoomIn className="w-3 h-3" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className={cn("p-0.5 rounded border cursor-pointer", isLightMode ? "bg-gray-50 hover:bg-gray-100 border-gray-200" : "bg-zinc-900 hover:bg-zinc-850 border-zinc-800")}
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            onClick={handleReset}
            title="Reset view"
            className={cn("p-0.5 rounded border cursor-pointer", isLightMode ? "bg-gray-50 hover:bg-gray-100 border-gray-200" : "bg-zinc-900 hover:bg-zinc-850 border-zinc-800")}
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full min-h-0 overflow-visible select-none cursor-crosshair font-sans flex-1"
      >
        {/* Grid lines */}
        {yTicks.map((yVal, i) => (
          <line
            key={`y-grid-${i}`}
            x1={paddingLeft}
            y1={toScreenY(yVal)}
            x2={width - paddingRight}
            y2={toScreenY(yVal)}
            stroke={isLightMode ? "#f3f4f6" : "#1f2937"}
            strokeWidth="0.8"
          />
        ))}
        {xTicks.map((xVal, i) => (
          <line
            key={`x-grid-${i}`}
            x1={toScreenX(xVal)}
            y1={paddingTop}
            x2={toScreenX(xVal)}
            y2={height - paddingBottom}
            stroke={isLightMode ? "#f3f4f6" : "#1f2937"}
            strokeWidth="0.8"
          />
        ))}

        {/* Axes (Publication Style: crisp solid thin lines) */}
        <line
          x1={paddingLeft}
          y1={height - paddingBottom}
          x2={width - paddingRight}
          y2={height - paddingBottom}
          stroke={isLightMode ? "#4b5563" : "#9ca3af"}
          strokeWidth="1.2"
        />
        <line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={height - paddingBottom}
          stroke={isLightMode ? "#4b5563" : "#9ca3af"}
          strokeWidth="1.2"
        />

        {/* Labels & Ticks */}
        {xTicks.map((xVal, i) => (
          <g key={`x-tick-${i}`}>
            <line
              x1={toScreenX(xVal)}
              y1={height - paddingBottom}
              x2={toScreenX(xVal)}
              y2={height - paddingBottom + 4}
              stroke={isLightMode ? "#4b5563" : "#9ca3af"}
              strokeWidth="1"
            />
            <text
              x={toScreenX(xVal)}
              y={height - 18}
              textAnchor="middle"
              className={cn("text-[9px] font-mono", isLightMode ? "fill-gray-600" : "fill-gray-400")}
            >
              {xVal}
            </text>
          </g>
        ))}
        {yTicks.map((yVal, i) => (
          <g key={`y-tick-${i}`}>
            <line
              x1={paddingLeft - 4}
              y1={toScreenY(yVal)}
              x2={paddingLeft}
              y2={toScreenY(yVal)}
              stroke={isLightMode ? "#4b5563" : "#9ca3af"}
              strokeWidth="1"
            />
            <text
              x={paddingLeft - 6}
              y={toScreenY(yVal) + 3}
              textAnchor="end"
              className={cn("text-[9px] font-mono", isLightMode ? "fill-gray-600" : "fill-gray-400")}
            >
              {yVal}
            </text>
          </g>
        ))}

        {/* Rotated Y-axis label */}
        <text
          x={-(paddingTop + chartHeight / 2)}
          y={13}
          transform="rotate(-90)"
          textAnchor="middle"
          className={cn("text-[9.5px] font-bold tracking-wide font-sans", isLightMode ? "fill-gray-500" : "fill-gray-400")}
        >
          {yLabel}
        </text>

        {/* X-axis label */}
        <text
          x={paddingLeft + chartWidth / 2}
          y={height - 3}
          textAnchor="middle"
          className={cn("text-[9.5px] font-bold tracking-wide font-sans", isLightMode ? "fill-gray-500" : "fill-gray-400")}
        >
          {xLabel}
        </text>

        {/* Connection line */}
        {pathData && (
          <polyline
            fill="none"
            stroke="url(#chartGrad)"
            strokeWidth="1.5"
            points={pathData}
          />
        )}

        {/* Discrete step dots */}
        {visiblePoints.map((p, i) => (
          <circle
            key={`dot-${i}`}
            cx={toScreenX(p.x)}
            cy={toScreenY(p.y)}
            r="1.8"
            className={cn(
              isLightMode ? "fill-white stroke-emerald-600" : "fill-zinc-950 stroke-emerald-400",
              "stroke-[1.2]"
            )}
          />
        ))}

        {/* Linear gradient definition */}
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* Current scanning step cursor indicator */}
        {currentPoint && (
          <>
            <line
              x1={toScreenX(currentPoint.x)}
              y1={paddingTop}
              x2={toScreenX(currentPoint.x)}
              y2={height - paddingBottom}
              stroke="#ef4444"
              strokeWidth="1.2"
              strokeDasharray="2,2"
            />
            <circle
              cx={toScreenX(currentPoint.x)}
              cy={toScreenY(currentPoint.y)}
              r="4"
              fill="#ef4444"
              stroke={isLightMode ? "#ffffff" : "#09090b"}
              strokeWidth="1.5"
            />
          </>
        )}

        {/* Interactive Mouse Hover Crosshair and values readout */}
        {hoverPoint && (
          <g>
            {/* Vertical crosshair */}
            <line
              x1={hoverPoint.screenX}
              y1={paddingTop}
              x2={hoverPoint.screenX}
              y2={height - paddingBottom}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="2,2"
              className={isLightMode ? "stroke-gray-400" : "stroke-gray-600"}
            />
            {/* Horizontal crosshair */}
            <line
              x1={paddingLeft}
              y1={hoverPoint.screenY}
              x2={width - paddingRight}
              y2={hoverPoint.screenY}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="2,2"
              className={isLightMode ? "stroke-gray-400" : "stroke-gray-600"}
            />
            {/* Highlight point intersection */}
            <circle
              cx={hoverPoint.screenX}
              cy={hoverPoint.screenY}
              r="3.5"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="1"
            />
            {/* Tooltip background & text */}
            <g transform={`translate(${hoverPoint.screenX > width / 2 ? hoverPoint.screenX - 75 : hoverPoint.screenX + 10}, ${hoverPoint.screenY > height / 2 ? hoverPoint.screenY - 35 : hoverPoint.screenY + 10})`}>
              <rect
                width="65"
                height="26"
                rx="3"
                className={isLightMode ? "fill-gray-900/95 stroke-gray-700" : "fill-zinc-950/95 stroke-zinc-700"}
                strokeWidth="0.8"
              />
              <text x="5" y="10" className="text-[8px] fill-white font-mono">
                S: {hoverPoint.x}
              </text>
              <text x="5" y="20" className="text-[8px] fill-white font-mono">
                V: {hoverPoint.y.toFixed(3)}
              </text>
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};

const TrajectoryPanel = ({ state, updateState, onClose }) => {
  const panelRef = useRef(null);

  // Generate trajectory points
  const trajectoryData = useMemo(() => {
    const data = [];
    const steps = Math.max(10, state.scanSteps);
    const start = state.scanStart;
    const stop = state.scanStop;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const scannedVal = start + t * (stop - start);

      let thetaDeg = 0;
      let energyKeV = 0;

      if (state.scanType === 'theta') {
        thetaDeg = scannedVal;
        const lambda = 2 * state.dSpacing * Math.sin(thetaDeg * Math.PI / 180);
        if (lambda > 0) {
          energyKeV = HC / lambda;
        }
      } else {
        energyKeV = scannedVal;
        const lambda = HC / energyKeV;
        const sinTheta = lambda / (2 * state.dSpacing);
        if (sinTheta <= 1 && sinTheta > 0) {
          thetaDeg = Math.asin(sinTheta) * 180 / Math.PI;
        }
      }

      // Calculations corresponding to autoGap / autoC2X
      const rayAngleOffsetDeg = (state.rayAngleOffset / 1000) * (180 / Math.PI);
      const globalPitchDeg    = (state.globalPitch    / 1000) * (180 / Math.PI);
      
      const trueBraggDeg = thetaDeg + globalPitchDeg - rayAngleOffsetDeg;
      const thetaRad = trueBraggDeg * Math.PI / 180;
      const cosTheta = Math.cos(thetaRad);

      let crystalGap = 0;
      let c1Y_val = state.c1Y;
      let c2Y_val = state.c2Y;

      // Gap calculation
      if (Math.abs(cosTheta) > 0.001) {
        crystalGap = state.offsetH / (2 * cosTheta);
        const isC1Pivot = state.rotationCenterMode === 'C1';
        if (isC1Pivot) {
          c2Y_val = c1Y_val + crystalGap;
        } else {
          c1Y_val = c2Y_val - crystalGap;
        }
      }

      // C2X calculation
      let c2X_val = state.c2X;
      if (state.autoC2X) {
        const tanTheta = Math.tan(thetaRad);
        if (Math.abs(tanTheta) >= 0.001) {
          const rawC2X = (c2Y_val - 2 * c1Y_val) / tanTheta - state.globalY / Math.sin(thetaRad);
          c2X_val = Math.max(state.c2XMin, Math.min(state.c2XMax, rawC2X));
        }
      }

      data.push({
        x: i,
        energy: energyKeV,
        theta: thetaDeg,
        gap: crystalGap,
        c2X: c2X_val
      });
    }

    return data;
  }, [
    state.scanType,
    state.scanStart,
    state.scanStop,
    state.scanSteps,
    state.dSpacing,
    state.offsetH,
    state.rotationCenterMode,
    state.c1Y,
    state.c2Y,
    state.c2XMin,
    state.c2XMax,
    state.globalY,
    state.globalPitch,
    state.rayAngleOffset,
    state.autoC2X,
    state.c2X
  ]);

  const xLabel = 'Step Index';
  const currentIdx = state.scanCurrentStep;

  // Chart datasets
  const energyData = useMemo(() => trajectoryData.map(d => ({ x: d.x, y: d.energy })), [trajectoryData]);
  const thetaData  = useMemo(() => trajectoryData.map(d => ({ x: d.x, y: d.theta })), [trajectoryData]);
  const gapData    = useMemo(() => trajectoryData.map(d => ({ x: d.x, y: d.gap })), [trajectoryData]);
  const c2XData    = useMemo(() => trajectoryData.map(d => ({ x: d.x, y: d.c2X })), [trajectoryData]);

  // Drag-to-resize height logic
  const handleMouseDown = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    const startHeight = state.trajectoryPanelHeight ?? 290;
    const startY = mouseDownEvent.clientY;

    const handleMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(180, Math.min(startHeight - deltaY, 500));
      updateState('trajectoryPanelHeight', newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const isMinimized = state.trajectoryPanelMinimized;

  return (
    <div
      ref={panelRef}
      style={{ height: isMinimized ? '38px' : `${state.trajectoryPanelHeight ?? 290}px` }}
      className={cn(
        "border-t flex flex-col relative w-full select-none z-20 transition-all duration-150 ease-out",
        state.isLightMode ? "bg-gray-100 border-gray-300 text-gray-900" : "bg-zinc-900 border-zinc-800 text-gray-100"
      )}
    >
      {/* Resizing Handle (only when not minimized) */}
      {!isMinimized && (
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 left-0 w-full h-1 cursor-ns-resize hover:bg-emerald-500/50 bg-transparent transition-colors z-30"
          title="Drag up or down to adjust panel height"
        />
      )}

      {/* Header bar */}
      <div className={cn(
        "h-9 px-4 flex items-center justify-between border-b shrink-0 text-xs font-semibold",
        state.isLightMode ? "bg-gray-200/50 border-gray-300" : "bg-zinc-950/40 border-zinc-800"
      )}>
        <div className="flex items-center gap-2">
          <span>📈 Trajectory Analysis &mdash; Discrete Steps</span>
          <span className={cn("text-[10px] font-normal px-2 py-0.5 rounded",
            state.isLightMode ? "bg-gray-300 text-gray-700" : "bg-zinc-850 text-zinc-400"
          )}>
            Range: {state.scanStart} to {state.scanStop} ({state.scanSteps} steps)
          </span>
        </div>

        {/* Panel controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateState('trajectoryPanelMinimized', !isMinimized)}
            title={isMinimized ? "Expand plots" : "Minimize plots"}
            className={cn(
              "p-1 rounded cursor-pointer transition-colors",
              state.isLightMode ? "hover:bg-gray-300 text-gray-600" : "hover:bg-zinc-800 text-zinc-400"
            )}
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            title="Close panel"
            className={cn(
              "p-1 rounded cursor-pointer transition-colors",
              state.isLightMode ? "hover:bg-gray-300 text-gray-600" : "hover:bg-zinc-800 text-zinc-400"
            )}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chart row (only visible when expanded) */}
      {!isMinimized && (
        <div className="flex-1 min-h-0 p-3 grid grid-cols-4 gap-3 overflow-x-auto overflow-y-hidden">
          {/* Chart 1: Theta vs Steps */}
          <SvgLineChart
            title="Theta Bragg Angle"
            data={thetaData}
            xLabel={xLabel}
            yLabel="Theta (Deg)"
            currentIdx={currentIdx}
            isLightMode={state.isLightMode}
          />

          {/* Chart 2: Energy vs Steps */}
          <SvgLineChart
            title="Photon Energy"
            data={energyData}
            xLabel={xLabel}
            yLabel="Energy (keV)"
            currentIdx={currentIdx}
            isLightMode={state.isLightMode}
          />

          {/* Chart 3: Gap vs Steps */}
          <SvgLineChart
            title="Crystal Gap (g)"
            data={gapData}
            xLabel={xLabel}
            yLabel="Gap (mm)"
            currentIdx={currentIdx}
            isLightMode={state.isLightMode}
          />

          {/* Chart 4: C2 Stage X vs Steps */}
          <SvgLineChart
            title="C2 Horizontal Stage"
            data={c2XData}
            xLabel={xLabel}
            yLabel="Stage X (mm)"
            currentIdx={currentIdx}
            isLightMode={state.isLightMode}
          />
        </div>
      )}
    </div>
  );
};

export default TrajectoryPanel;
