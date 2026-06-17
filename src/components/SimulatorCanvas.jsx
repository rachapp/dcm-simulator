import React, { useEffect, useRef, useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, Sun, Moon, Grid, Download, Crosshair } from 'lucide-react';
import { cn } from '../utils';

const SimulatorCanvas = ({
  state,
  updateState,
  crystals,
  rays,
  readout
}) => {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const [viewSize, setViewSize] = useState({ width: 0, height: 0 });

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = viewSize;
    if (width === 0 || height === 0) return;

    ctx.clearRect(0, 0, width * dpr, height * dpr);

    ctx.save();
    ctx.scale(dpr, dpr);

    const viewW = 300;
    const viewH = 150;
    const baseScale = Math.min(width / viewW, height / viewH) * 0.95;
    const scale = baseScale * state.zoom;
    const cx = width / 2;
    const cy = height / 2;

    const toScreen = (x, y) => [
      cx + (x - state.viewCenterX) * scale,
      cy - (y - state.viewCenterY) * scale
    ];

    const physMinX = state.viewCenterX + (0 - cx) / scale;
    const physMaxX = state.viewCenterX + (width - cx) / scale;
    const physMaxY = state.viewCenterY - (0 - cy) / scale;
    const physMinY = state.viewCenterY - (height - cy) / scale;

    // Grid
    if (state.showGrid) {
      const startX = Math.floor(physMinX / 10) * 10;
      const endX   = Math.ceil(physMaxX / 10) * 10;
      const startY = Math.floor(physMinY / 10) * 10;
      const endY   = Math.ceil(physMaxY / 10) * 10;

      ctx.beginPath();
      ctx.strokeStyle = state.isLightMode ? '#d1d5db' : '#1f2937';
      ctx.lineWidth = 1;
      for (let x = startX; x <= endX; x += 10) {
        const p1 = toScreen(x, physMinY);
        const p2 = toScreen(x, physMaxY);
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
      }
      for (let y = startY; y <= endY; y += 10) {
        const p1 = toScreen(physMinX, y);
        const p2 = toScreen(physMaxX, y);
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
      }
      ctx.stroke();
    }

    // Axes
    if (state.showAxes) {
      ctx.beginPath();
      ctx.strokeStyle = state.isLightMode ? '#9ca3af' : '#374151';
      ctx.lineWidth = 1;
      const xLeft  = toScreen(physMinX, 0);
      const xRight = toScreen(physMaxX, 0);
      ctx.moveTo(xLeft[0], xLeft[1]);
      ctx.lineTo(xRight[0], xRight[1]);
      const yTop = toScreen(0, physMaxY);
      const yBot = toScreen(0, physMinY);
      ctx.moveTo(yTop[0], yTop[1]);
      ctx.lineTo(yBot[0], yBot[1]);
      ctx.stroke();
    }

    // Origin marker (Pivot Point)
    // FIX P2: removed the duplicate ctx.beginPath() that was a no-op here
    const cp = toScreen(readout.pivotMarkerPos[0], readout.pivotMarkerPos[1]);
    ctx.beginPath();
    ctx.moveTo(cp[0] - 8, cp[1] - 8); ctx.lineTo(cp[0] + 8, cp[1] + 8);
    ctx.moveTo(cp[0] + 8, cp[1] - 8); ctx.lineTo(cp[0] - 8, cp[1] + 8);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Small dot at the exact coordinate
    ctx.beginPath();
    ctx.arc(cp[0], cp[1], 3, 0, Math.PI * 2);
    ctx.fillStyle = '#eab308';
    ctx.fill();

    // Detectors
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    const pTop1 = toScreen(state.det1X, physMaxY);
    const pBot1 = toScreen(state.det1X, physMinY);
    ctx.moveTo(pTop1[0], pTop1[1]); ctx.lineTo(pBot1[0], pBot1[1]);
    ctx.strokeStyle = '#3b82f6';
    ctx.stroke();

    ctx.beginPath();
    const pTop2 = toScreen(state.det2X, physMaxY);
    const pBot2 = toScreen(state.det2X, physMinY);
    ctx.moveTo(pTop2[0], pTop2[1]); ctx.lineTo(pBot2[0], pBot2[1]);
    ctx.strokeStyle = '#eab308';
    ctx.stroke();
    ctx.setLineDash([]);

    // Crystals
    for (const rect of crystals) {
      const pts = rect.getCorners().map(p => toScreen(p[0], p[1]));
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      ctx.strokeStyle = state.isLightMode ? '#4b5563' : '#e5e7eb';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const rx = rect.rotation_center ? rect.rotation_center[0] : rect.x + rect.w / 2;
      const ry = rect.rotation_center ? rect.rotation_center[1] : rect.y + rect.h / 2;
      const rp = toScreen(rx, ry);
      ctx.beginPath();
      ctx.moveTo(rp[0] - 4, rp[1] - 4); ctx.lineTo(rp[0] + 4, rp[1] + 4);
      ctx.moveTo(rp[0] + 4, rp[1] - 4); ctx.lineTo(rp[0] - 4, rp[1] + 4);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Rays
    for (const ray of rays) {
      ctx.beginPath();
      const p0 = toScreen(ray.path[0][0], ray.path[0][1]);
      ctx.moveTo(p0[0], p0[1]);
      for (let i = 1; i < ray.path.length; i++) {
        const p = toScreen(ray.path[i][0], ray.path[i][1]);
        ctx.lineTo(p[0], p[1]);
      }
      ctx.strokeStyle = ray.color;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  // FIX B3: include readout in dependency array so pivot marker always redraws
  }, [viewSize, state, crystals, rays, readout, dpr]);

  useEffect(() => {
    draw();
  }, [draw]);

  // FIX I3: Use ResizeObserver instead of window 'resize' event so the
  // canvas correctly resizes when the sidebar is toggled (no window resize fires).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setViewSize({ width, height });
      }
    });

    observer.observe(container);
    // Capture initial size immediately
    setViewSize({
      width:  container.clientWidth,
      height: container.clientHeight,
    });

    return () => observer.disconnect();
  }, []); // run once on mount — ResizeObserver handles all subsequent changes

  // --- Pan state (local refs) --- FIX I2 ---
  // We use refs instead of state so panning never triggers a React re-render
  // on every mousemove — the canvas is redrawn directly. The committed pan
  // position is pushed to global state only on mouseup.
  const isDragging   = useRef(false);
  const lastMouse    = useRef({ x: 0, y: 0 });
  const localPan     = useRef({ x: state.viewCenterX, y: state.viewCenterY });

  // Keep localPan in sync when external state changes (e.g. reset)
  useEffect(() => {
    localPan.current = { x: state.viewCenterX, y: state.viewCenterY };
  }, [state.viewCenterX, state.viewCenterY]);

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const factor  = e.deltaY < 0 ? (1 + zoomSpeed) : 1 / (1 + zoomSpeed);
    const newZoom = Math.max(0.1, Math.min(state.zoom * factor, 10));
    updateState('zoom', newZoom);
  };

  const handleMouseDown = (e) => {
    isDragging.current  = true;
    lastMouse.current   = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };

    const viewW     = 300;
    const viewH     = 150;
    const baseScale = Math.min(viewSize.width / viewW, viewSize.height / viewH) * 0.95;
    const scale     = baseScale * state.zoom;

    // Update local pan ref and redraw without touching React state
    localPan.current = {
      x: localPan.current.x - dx / scale,
      y: localPan.current.y + dy / scale,
    };

    // Draw immediately using the local pan value
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Temporarily override state values in the draw context
    const overriddenState = {
      ...state,
      viewCenterX: localPan.current.x,
      viewCenterY: localPan.current.y,
    };
    drawWithState(overriddenState, canvas, viewSize, crystals, rays, readout);
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    // FIX I2: commit pan to global state only once on mouseup
    updateState({ viewCenterX: localPan.current.x, viewCenterY: localPan.current.y });
  };

  // --- SVG Export Logic ---
  const generateSVGString = useCallback(() => {
    const { width, height } = viewSize;
    if (width === 0 || height === 0) return '';

    const viewW = 300;
    const viewH = 150;
    const baseScale = Math.min(width / viewW, height / viewH) * 0.95;
    const scale = baseScale * state.zoom;
    const cx = width / 2;
    const cy = height / 2;

    const toScreen = (x, y) => [
      cx + (x - state.viewCenterX) * scale,
      cy - (y - state.viewCenterY) * scale
    ];

    const physMinX = state.viewCenterX + (0 - cx) / scale;
    const physMaxX = state.viewCenterX + (width - cx) / scale;
    const physMaxY = state.viewCenterY - (0 - cy) / scale;
    const physMinY = state.viewCenterY - (height - cy) / scale;

    const bgColor = state.isLightMode ? '#e5e7eb' : '#000000';
    const gridColor = state.isLightMode ? '#d1d5db' : '#1f2937';
    const axesColor = state.isLightMode ? '#9ca3af' : '#374151';
    const crystalStroke = state.isLightMode ? '#4b5563' : '#e5e7eb';

    let svgContent = [];

    // Background (omit in day mode for transparent background)
    if (!state.isLightMode) {
      svgContent.push(`<rect width="${width}" height="${height}" fill="#000000" />`);
    }

    // Grid
    if (state.showGrid) {
      const startX = Math.floor(physMinX / 10) * 10;
      const endX   = Math.ceil(physMaxX / 10) * 10;
      const startY = Math.floor(physMinY / 10) * 10;
      const endY   = Math.ceil(physMaxY / 10) * 10;

      for (let x = startX; x <= endX; x += 10) {
        const p1 = toScreen(x, physMinY);
        const p2 = toScreen(x, physMaxY);
        svgContent.push(`<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="${gridColor}" stroke-width="1" />`);
      }
      for (let y = startY; y <= endY; y += 10) {
        const p1 = toScreen(physMinX, y);
        const p2 = toScreen(physMaxX, y);
        svgContent.push(`<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke="${gridColor}" stroke-width="1" />`);
      }
    }

    // Axes
    if (state.showAxes) {
      const xLeft  = toScreen(physMinX, 0);
      const xRight = toScreen(physMaxX, 0);
      svgContent.push(`<line x1="${xLeft[0]}" y1="${xLeft[1]}" x2="${xRight[0]}" y2="${xRight[1]}" stroke="${axesColor}" stroke-width="1" />`);

      const yTop = toScreen(0, physMaxY);
      const yBot = toScreen(0, physMinY);
      svgContent.push(`<line x1="${yTop[0]}" y1="${yTop[1]}" x2="${yBot[0]}" y2="${yBot[1]}" stroke="${axesColor}" stroke-width="1" />`);
    }

    // Detectors
    const pTop1 = toScreen(state.det1X, physMaxY);
    const pBot1 = toScreen(state.det1X, physMinY);
    svgContent.push(`<line x1="${pTop1[0]}" y1="${pTop1[1]}" x2="${pBot1[0]}" y2="${pBot1[1]}" stroke="#3b82f6" stroke-width="1" stroke-dasharray="5,5" />`);

    const pTop2 = toScreen(state.det2X, physMaxY);
    const pBot2 = toScreen(state.det2X, physMinY);
    svgContent.push(`<line x1="${pTop2[0]}" y1="${pTop2[1]}" x2="${pBot2[0]}" y2="${pBot2[1]}" stroke="#eab308" stroke-width="1" stroke-dasharray="5,5" />`);

    // Crystals
    for (const rect of crystals) {
      const pts = rect.getCorners().map(p => toScreen(p[0], p[1]));
      const pointsStr = pts.map(p => p.join(',')).join(' ');
      svgContent.push(`<polygon points="${pointsStr}" stroke="${crystalStroke}" stroke-width="1.5" fill="none" />`);

      // Rotation center marker
      const rx = rect.rotation_center ? rect.rotation_center[0] : rect.x + rect.w / 2;
      const ry = rect.rotation_center ? rect.rotation_center[1] : rect.y + rect.h / 2;
      const rp = toScreen(rx, ry);
      svgContent.push(`<line x1="${rp[0] - 4}" y1="${rp[1] - 4}" x2="${rp[0] + 4}" y2="${rp[1] + 4}" stroke="#eab308" stroke-width="2" />`);
      svgContent.push(`<line x1="${rp[0] + 4}" y1="${rp[1] - 4}" x2="${rp[0] - 4}" y2="${rp[1] + 4}" stroke="#eab308" stroke-width="2" />`);
    }

    // Rays
    for (const ray of rays) {
      const pts = ray.path.map(p => toScreen(p[0], p[1]));
      const pointsStr = pts.map(p => p.join(',')).join(' ');
      svgContent.push(`<polyline points="${pointsStr}" stroke="${ray.color}" stroke-width="1" fill="none" />`);
    }

    // Origin marker (Pivot Point)
    const cp = toScreen(readout.pivotMarkerPos[0], readout.pivotMarkerPos[1]);
    svgContent.push(`<line x1="${cp[0] - 8}" y1="${cp[1] - 8}" x2="${cp[0] + 8}" y2="${cp[1] + 8}" stroke="#eab308" stroke-width="2.5" />`);
    svgContent.push(`<line x1="${cp[0] + 8}" y1="${cp[1] - 8}" x2="${cp[0] - 8}" y2="${cp[1] + 8}" stroke="#eab308" stroke-width="2.5" />`);
    svgContent.push(`<circle cx="${cp[0]}" cy="${cp[1]}" r="3" fill="#eab308" />`);

    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  ${svgContent.join('\n  ')}\n</svg>`;
  }, [viewSize, state, crystals, rays, readout]);

  const handleExportSVG = () => {
    const svgString = generateSVGString();
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dcm_simulator_${state.crystalType || 'Si111'}_${state.rectRotation}deg.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 relative bg-black overflow-hidden" ref={containerRef}>
      <canvas
        ref={canvasRef}
        width={viewSize.width * dpr}
        height={viewSize.height * dpr}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={cn(
          "cursor-grab active:cursor-grabbing block w-full h-full transition-colors duration-300",
          state.isLightMode ? "bg-gray-200" : "bg-black"
        )}
      />

      {/* Floating Controls */}
      <div className="absolute top-6 left-6 flex gap-2">
        <button
          onClick={() => updateState('uiVisible', !state.uiVisible)}
          className="bg-gray-900/80 hover:bg-gray-800 text-gray-300 px-3 py-1.5 rounded border border-gray-700 shadow-xl backdrop-blur-sm transition-all text-xs font-semibold tracking-wide flex items-center"
          title="Toggle UI"
        >
          {state.uiVisible ? <ChevronLeft size={14} className="mr-1.5" /> : <ChevronRight size={14} className="mr-1.5" />}
          UI
        </button>
        <button
          onClick={() => updateState('isLightMode', !state.isLightMode)}
          className="bg-gray-900/80 hover:bg-gray-800 text-gray-300 px-3 py-1.5 rounded border border-gray-700 shadow-xl backdrop-blur-sm transition-all text-xs font-semibold tracking-wide flex items-center"
          title="Toggle Theme"
        >
          {state.isLightMode ? <Moon size={14} className="mr-1.5" /> : <Sun size={14} className="mr-1.5" />}
          Day/Night
        </button>
        <button
          onClick={() => updateState('showGrid', !state.showGrid)}
          className={cn(
            "px-3 py-1.5 rounded border shadow-xl backdrop-blur-sm transition-all text-xs font-semibold tracking-wide flex items-center",
            state.showGrid ? "bg-blue-600 border-blue-400 text-white" : "bg-gray-900/80 border-gray-700 text-gray-300 hover:bg-gray-800"
          )}
          title="Toggle Grid"
        >
          <Grid size={14} className="mr-1.5" />
          Grid
        </button>
        <button
          onClick={() => updateState('showAxes', !state.showAxes)}
          className={cn(
            "px-3 py-1.5 rounded border shadow-xl backdrop-blur-sm transition-all text-xs font-semibold tracking-wide flex items-center",
            state.showAxes ? "bg-blue-600 border-blue-400 text-white" : "bg-gray-900/80 border-gray-700 text-gray-300 hover:bg-gray-800"
          )}
          title="Toggle Axes"
        >
          <Crosshair size={14} className="mr-1.5" />
          Axes
        </button>
        <button
          onClick={handleExportSVG}
          className="bg-gray-900/80 hover:bg-gray-800 text-gray-300 px-3 py-1.5 rounded border border-gray-700 shadow-xl backdrop-blur-sm transition-all text-xs font-semibold tracking-wide flex items-center"
          title="Export as Vector SVG"
        >
          <Download size={14} className="mr-1.5" />
          Export SVG
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Standalone draw function used during mousemove panning so we can draw with
// a temporary pan offset without triggering React state updates.
// ---------------------------------------------------------------------------
function drawWithState(state, canvas, viewSize, crystals, rays, readout) {
  const ctx = canvas.getContext('2d');
  const { width, height } = viewSize;
  if (width === 0 || height === 0) return;

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  ctx.clearRect(0, 0, width * dpr, height * dpr);

  ctx.save();
  ctx.scale(dpr, dpr);

  const viewW = 300;
  const viewH = 150;
  const baseScale = Math.min(width / viewW, height / viewH) * 0.95;
  const scale = baseScale * state.zoom;
  const cx = width / 2;
  const cy = height / 2;

  const toScreen = (x, y) => [
    cx + (x - state.viewCenterX) * scale,
    cy - (y - state.viewCenterY) * scale
  ];

  const physMinX = state.viewCenterX + (0 - cx) / scale;
  const physMaxX = state.viewCenterX + (width - cx) / scale;
  const physMaxY = state.viewCenterY - (0 - cy) / scale;
  const physMinY = state.viewCenterY - (height - cy) / scale;

  if (state.showGrid) {
    const startX = Math.floor(physMinX / 10) * 10;
    const endX   = Math.ceil(physMaxX / 10) * 10;
    const startY = Math.floor(physMinY / 10) * 10;
    const endY   = Math.ceil(physMaxY / 10) * 10;
    ctx.beginPath();
    ctx.strokeStyle = state.isLightMode ? '#d1d5db' : '#1f2937';
    ctx.lineWidth = 1;
    for (let x = startX; x <= endX; x += 10) {
      const p1 = toScreen(x, physMinY); const p2 = toScreen(x, physMaxY);
      ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]);
    }
    for (let y = startY; y <= endY; y += 10) {
      const p1 = toScreen(physMinX, y); const p2 = toScreen(physMaxX, y);
      ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]);
    }
    ctx.stroke();
  }

  if (state.showAxes) {
    ctx.beginPath();
    ctx.strokeStyle = state.isLightMode ? '#9ca3af' : '#374151';
    ctx.lineWidth = 1;
    const xLeft = toScreen(physMinX, 0); const xRight = toScreen(physMaxX, 0);
    ctx.moveTo(xLeft[0], xLeft[1]); ctx.lineTo(xRight[0], xRight[1]);
    const yTop = toScreen(0, physMaxY); const yBot = toScreen(0, physMinY);
    ctx.moveTo(yTop[0], yTop[1]); ctx.lineTo(yBot[0], yBot[1]);
    ctx.stroke();
  }

  const cp = toScreen(readout.pivotMarkerPos[0], readout.pivotMarkerPos[1]);
  ctx.beginPath();
  ctx.moveTo(cp[0] - 8, cp[1] - 8); ctx.lineTo(cp[0] + 8, cp[1] + 8);
  ctx.moveTo(cp[0] + 8, cp[1] - 8); ctx.lineTo(cp[0] - 8, cp[1] + 8);
  ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.beginPath(); ctx.arc(cp[0], cp[1], 3, 0, Math.PI * 2);
  ctx.fillStyle = '#eab308'; ctx.fill();

  ctx.beginPath(); ctx.setLineDash([5, 5]);
  const pTop1 = toScreen(state.det1X, physMaxY); const pBot1 = toScreen(state.det1X, physMinY);
  ctx.moveTo(pTop1[0], pTop1[1]); ctx.lineTo(pBot1[0], pBot1[1]);
  ctx.strokeStyle = '#3b82f6'; ctx.stroke();
  ctx.beginPath();
  const pTop2 = toScreen(state.det2X, physMaxY); const pBot2 = toScreen(state.det2X, physMinY);
  ctx.moveTo(pTop2[0], pTop2[1]); ctx.lineTo(pBot2[0], pBot2[1]);
  ctx.strokeStyle = '#eab308'; ctx.stroke();
  ctx.setLineDash([]);

  for (const rect of crystals) {
    const pts = rect.getCorners().map(p => toScreen(p[0], p[1]));
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < 4; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.strokeStyle = state.isLightMode ? '#4b5563' : '#e5e7eb';
    ctx.lineWidth = 1.5; ctx.stroke();
    const rx = rect.rotation_center ? rect.rotation_center[0] : rect.x + rect.w / 2;
    const ry = rect.rotation_center ? rect.rotation_center[1] : rect.y + rect.h / 2;
    const rp = toScreen(rx, ry);
    ctx.beginPath();
    ctx.moveTo(rp[0] - 4, rp[1] - 4); ctx.lineTo(rp[0] + 4, rp[1] + 4);
    ctx.moveTo(rp[0] + 4, rp[1] - 4); ctx.lineTo(rp[0] - 4, rp[1] + 4);
    ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2; ctx.stroke();
  }

  for (const ray of rays) {
    ctx.beginPath();
    const p0 = toScreen(ray.path[0][0], ray.path[0][1]);
    ctx.moveTo(p0[0], p0[1]);
    for (let i = 1; i < ray.path.length; i++) {
      const p = toScreen(ray.path[i][0], ray.path[i][1]);
      ctx.lineTo(p[0], p[1]);
    }
    ctx.strokeStyle = ray.color; ctx.lineWidth = 1; ctx.stroke();
  }

  ctx.restore();
}

export default SimulatorCanvas;
