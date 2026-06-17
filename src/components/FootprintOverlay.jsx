import React, { useMemo, useState } from 'react';
import { Minimize2, Maximize2, ZoomIn, ZoomOut, GripHorizontal } from 'lucide-react';
import { cn } from '../utils';

// Helper to compute footprint data points and power fraction
function getFootprintDetails(len, hitOffset, sinTheta, beamSize) {
  if (Math.abs(sinTheta) < 0.0001) {
    return { data: [], fraction: 0, plotMin: -len/2, plotMax: len/2 };
  }

  const steps = 100;
  const tMin = -len / 2;
  const tMax = len / 2;
  
  // Beam footprint scale factor
  const wScale = beamSize / sinTheta;
  
  // Set plot range to cover both crystal boundaries and the footprint profile
  const plotMin = Math.min(tMin - 5, hitOffset - 2.5 * wScale);
  const plotMax = Math.max(tMax + 5, hitOffset + 2.5 * wScale);

  const data = [];
  for (let i = 0; i <= steps; i++) {
    const t = plotMin + (i / steps) * (plotMax - plotMin);
    const w = (t - hitOffset) * sinTheta;
    const intensity = Math.exp(-8 * (w * w) / (beamSize * beamSize));
    const onCrystal = t >= tMin && t <= tMax;
    data.push({ t, intensity, onCrystal });
  }

  // Integrate accepted power fraction numerically in beam space (±3*w_0)
  const beamSteps = 200;
  let sumTotal = 0;
  let sumAccepted = 0;
  const maxW = beamSize; // beamSize = 4sigma, so -maxW to +maxW represents an 8sigma total span
  
  for (let i = 0; i <= beamSteps; i++) {
    const w = -maxW + (i / beamSteps) * (2 * maxW);
    const intensity = Math.exp(-8 * (w * w) / (beamSize * beamSize));
    const dw = (2 * maxW) / beamSteps;
    
    // Corresponding coordinate on crystal
    const t = w / sinTheta + hitOffset;
    const onCrystal = t >= tMin && t <= tMax;

    sumTotal += intensity * dw;
    if (onCrystal) {
      sumAccepted += intensity * dw;
    }
  }

  const fraction = sumTotal > 0 ? sumAccepted / sumTotal : 0;
  return { data, fraction, plotMin, plotMax };
}

const FootprintPlot = ({ title, len, hitOffset, sinTheta, beamSize, isLightMode }) => {
  const hasHit = hitOffset !== null && sinTheta !== null;
  
  const { data, fraction, plotMin, plotMax } = useMemo(() => {
    if (!hasHit) return { data: [], fraction: 0, plotMin: -len/2, plotMax: len/2 };
    return getFootprintDetails(len, hitOffset, sinTheta, beamSize);
  }, [len, hitOffset, sinTheta, beamSize, hasHit]);

  if (!hasHit) {
    return (
      <div className={cn(
        "rounded-lg p-3 border h-28 flex flex-col items-center justify-center text-xs transition-colors duration-300",
        isLightMode ? "bg-gray-100/50 border-gray-200 text-gray-500" : "bg-gray-950/50 border-gray-800 text-gray-400"
      )}>
        <div className="font-semibold mb-1 text-[11px]">{title}</div>
        <div className="text-[10px] opacity-75">No beam hit detected</div>
      </div>
    );
  }

  const width = 300;
  const height = 90;
  const paddingX = 15;
  const paddingY = 15;

  // Coordinate scales
  const scaleX = (t) => paddingX + ((t - plotMin) / (plotMax - plotMin)) * (width - 2 * paddingX);
  const scaleY = (intensity) => height - paddingY - intensity * (height - 2 * paddingY);

  const tMin = -len / 2;
  const tMax = len / 2;
  const xLeft = scaleX(tMin);
  const xRight = scaleX(tMax);
  const xHit = scaleX(hitOffset);

  // Generate SVG path for the Gaussian footprint curve
  let pathD = '';
  if (data.length > 0) {
    pathD = `M ${scaleX(data[0].t)} ${scaleY(0)}`;
    data.forEach(p => {
      pathD += ` L ${scaleX(p.t)} ${scaleY(p.intensity)}`;
    });
    pathD += ` L ${scaleX(data[data.length - 1].t)} ${scaleY(0)} Z`;
  }

  const pct = (fraction * 100).toFixed(1);
  const isSpilled = fraction < 0.999;

  return (
    <div className={cn(
      "rounded-lg p-3 border flex flex-col gap-1.5 transition-colors duration-300",
      isLightMode ? "bg-gray-50/80 border-gray-200" : "bg-gray-950/60 border-gray-800/80"
    )}>
      <div className="flex justify-between items-center text-[11px] font-semibold">
        <span className={isLightMode ? "text-gray-700 font-bold" : "text-gray-200 font-bold"}>{title}</span>
        <span className={cn(
          "font-mono font-bold",
          isSpilled ? "text-rose-500" : "text-emerald-500"
        )}>
          Accepted: {pct}% {isSpilled && "⚠️"}
        </span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
          <defs>
            <clipPath id={`${title.replace(/\s+/g, '')}-clip`}>
              <rect x={xLeft} y={0} width={Math.max(0, xRight - xLeft)} height={height} />
            </clipPath>
          </defs>

          {/* Plot grid/axes */}
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke={isLightMode ? "#d1d5db" : "#374151"} strokeWidth="1" />
          
          {/* Crystal bounds indicators */}
          <line x1={xLeft} y1={paddingY} x2={xLeft} y2={height - paddingY} stroke={isLightMode ? "#d1d5db" : "#374151"} strokeWidth="1" strokeDasharray="3,3" />
          <line x1={xRight} y1={paddingY} x2={xRight} y2={height - paddingY} stroke={isLightMode ? "#d1d5db" : "#374151"} strokeWidth="1" strokeDasharray="3,3" />

          {/* The Crystal Bar */}
          <rect 
            x={xLeft} 
            y={height - paddingY - 4} 
            width={Math.max(0, xRight - xLeft)} 
            height="8" 
            fill={isLightMode ? "rgba(107, 114, 128, 0.15)" : "rgba(156, 163, 175, 0.15)"} 
            stroke={isLightMode ? "#6b7280" : "#9ca3af"} 
            strokeWidth="1" 
            rx="1.5" 
          />

          {/* Footprint curve - Red spill background */}
          {pathD && (
            <path d={pathD} fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" strokeWidth="1.2" />
          )}

          {/* Footprint curve - Green accepted overlay (clipped to crystal) */}
          {pathD && (
            <path 
              d={pathD} 
              fill="rgba(16, 185, 129, 0.35)" 
              stroke="#10b981" 
              strokeWidth="1.5" 
              clipPath={`url(#${title.replace(/\s+/g, '')}-clip)`} 
            />
          )}

          {/* Central Hit Indicator (dashed yellow line + center dot) */}
          {xHit >= paddingX && xHit <= width - paddingX && (
            <>
              <line x1={xHit} y1={paddingY} x2={xHit} y2={height - paddingY - 4} stroke="#eab308" strokeWidth="1" strokeDasharray="2,2" />
              <circle cx={xHit} cy={height - paddingY} r="2.5" fill="#eab308" />
            </>
          )}

          {/* Text Labels */}
          <text x={xLeft} y={height - 2} textAnchor="middle" fontSize="7" fill={isLightMode ? "#6b7280" : "#9ca3af"} fontFamily="monospace">-{len/2}</text>
          <text x={xRight} y={height - 2} textAnchor="middle" fontSize="7" fill={isLightMode ? "#6b7280" : "#9ca3af"} fontFamily="monospace">+{len/2}</text>
          {hasHit && (
            <text x={xHit} y={paddingY - 4} textAnchor="middle" fontSize="8" fill="#eab308" fontFamily="monospace" fontWeight="bold">
              {hitOffset.toFixed(1)} mm
            </text>
          )}
        </svg>
      </div>
    </div>
  );
};

const FootprintOverlay = ({ state, updateState, readout }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [panelWidth, setPanelWidth] = useState(320);

  // If UI is hidden, don't show the footprint overlay either
  if (!state.uiVisible) return null;

  const footprintData = useMemo(() => {
    const { centralRay } = readout;
    if (!centralRay || centralRay.path.length < 2) return null;

    // Global rotation angles
    const globalPitchDeg = (state.globalPitch / 1000) * (180 / Math.PI);
    const thetaC1 = state.rectRotation + globalPitchDeg;
    const thetaC2 = state.rectRotation + globalPitchDeg + (state.c2Pitch / 1000000) * (180 / Math.PI);

    const thetaC1Rad = thetaC1 * Math.PI / 180;
    const thetaC2Rad = thetaC2 * Math.PI / 180;

    // Lab frame centers of C1 (top surface center) and C2 (bottom surface center)
    const c1CenterLab = [
      state.globalX - state.c1Y * Math.sin(thetaC1Rad),
      state.globalY + state.c1Y * Math.cos(thetaC1Rad)
    ];
    const c2CenterLab = [
      state.globalX + state.c2X * Math.cos(thetaC2Rad) - state.c2Y * Math.sin(thetaC2Rad),
      state.globalY + state.c2X * Math.sin(thetaC2Rad) + state.c2Y * Math.cos(thetaC2Rad)
    ];

    // C1 Hit (point 1 of central ray path)
    const p1 = centralRay.path[1];
    const cosC1 = Math.cos(thetaC1Rad);
    const sinC1 = Math.sin(thetaC1Rad);
    const hitC1Offset = (p1[0] - c1CenterLab[0]) * cosC1 + (p1[1] - c1CenterLab[1]) * sinC1;

    // Ray angles
    const alphaIn = state.rayAngle / 1000;
    const thetaInc1 = thetaC1Rad - alphaIn;

    // C2 Hit (point 2 of central ray path)
    let hitC2Offset = null;
    let thetaInc2 = null;
    if (centralRay.path.length >= 3) {
      const p2 = centralRay.path[2];
      const cosC2 = Math.cos(thetaC2Rad);
      const sinC2 = Math.sin(thetaC2Rad);
      hitC2Offset = (p2[0] - c2CenterLab[0]) * cosC2 + (p2[1] - c2CenterLab[1]) * sinC2;

      const alphaRefl = 2 * thetaC1Rad - alphaIn;
      thetaInc2 = alphaRefl - thetaC2Rad;
    }

    return {
      hitC1Offset,
      thetaInc1,
      hitC2Offset,
      thetaInc2
    };
  }, [state.globalPitch, state.rectRotation, state.c2Pitch, state.globalX, state.globalY, state.c1Y, state.c2X, state.c2Y, state.rayAngle, readout]);

  const handleHeaderMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('input')) return;

    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const initX = position.x;
    const initY = position.y;

    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      setPosition({
        x: initX + dx,
        y: initY + dy
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleDoubleClick = () => {
    setPosition({ x: 0, y: 0 });
    setPanelWidth(320);
  };

  return (
    <div 
      className={cn(
        "absolute bottom-6 right-6 border shadow-2xl rounded-lg p-4 backdrop-blur-sm flex flex-col gap-3 z-10 pointer-events-auto transition-colors duration-300",
        state.isLightMode ? "bg-white/90 border-gray-200 text-gray-800" : "bg-gray-900/90 border-gray-800 text-gray-200"
      )}
      style={{ 
        width: `${panelWidth}px`,
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
    >
      {/* Draggable Header */}
      <div 
        onMouseDown={handleHeaderMouseDown}
        onDoubleClick={handleDoubleClick}
        className="flex justify-between items-center border-b pb-1.5 border-gray-700/50 cursor-move select-none"
        title="Drag to move. Double-click to reset."
      >
        <div className="flex items-center gap-1.5">
          <GripHorizontal size={14} className="opacity-50" />
          <span className="text-xs uppercase tracking-wider font-bold text-violet-500">
            Gaussian Footprint
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom controls (hidden when minimized) */}
          {!isMinimized && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPanelWidth(prev => Math.max(280, prev - 40))}
                className="hover:bg-gray-700/30 p-1 rounded transition text-violet-400 hover:text-violet-500"
                title="Scale Down"
              >
                <ZoomOut size={12} />
              </button>
              <button
                onClick={() => setPanelWidth(prev => Math.min(600, prev + 40))}
                className="hover:bg-gray-700/30 p-1 rounded transition text-violet-400 hover:text-violet-500"
                title="Scale Up"
              >
                <ZoomIn size={12} />
              </button>
            </div>
          )}

          {/* Minimize / Maximize toggle */}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hover:bg-gray-700/30 p-1 rounded transition text-violet-400 hover:text-violet-500"
            title={isMinimized ? "Expand Panel" : "Minimize Panel"}
          >
            {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
          </button>
        </div>
      </div>

      {/* Panel Content (plots) - Hidden when minimized */}
      {!isMinimized && (
        <>
          <div className="text-[10px] opacity-75 font-mono">
            Beam size: {state.beamSize.toFixed(1)} mm
          </div>

          <FootprintPlot 
            title="Crystal 1 Footprint (C1)" 
            len={state.c1Len} 
            hitOffset={footprintData ? footprintData.hitC1Offset : null} 
            sinTheta={footprintData ? Math.sin(footprintData.thetaInc1) : null} 
            beamSize={state.beamSize}
            isLightMode={state.isLightMode}
          />

          <FootprintPlot 
            title="Crystal 2 Footprint (C2)" 
            len={state.c2Len} 
            hitOffset={footprintData ? footprintData.hitC2Offset : null} 
            sinTheta={footprintData ? Math.sin(footprintData.thetaInc2) : null} 
            beamSize={state.beamSize}
            isLightMode={state.isLightMode}
          />
        </>
      )}
    </div>
  );
};

export default FootprintOverlay;
