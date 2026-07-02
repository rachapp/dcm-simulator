import React, { useEffect, useLayoutEffect, useRef, useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, Sun, Moon, Grid, Download, Crosshair, GripHorizontal, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '../utils';

const SimulatorCanvas = ({
  state,
  updateState,
  crystals,
  rays,
  readout,
  mirror
}) => {
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const [viewSize, setViewSize] = useState({ width: 0, height: 0 });
  const [controlsPos, setControlsPos] = useState({ x: 0, y: 0 });
  const [controlsMinimized, setControlsMinimized] = useState(false);

  const handleControlsDrag = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button')) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const initX = controlsPos.x;
    const initY = controlsPos.y;

    const onMouseMove = (moveEvent) => {
      setControlsPos({
        x: initX + (moveEvent.clientX - startX),
        y: initY + (moveEvent.clientY - startY)
      });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

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

    // Mirror
    if (mirror) {
      const pts = mirror.getCorners().map(p => toScreen(p[0], p[1]));
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      ctx.fillStyle = 'rgba(249, 115, 22, 0.18)';
      ctx.fill();
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Rays (split at mirror hit: forward = ray.color, return = orange)
    const RETURN_COLOR = '#f97316';
    for (const ray of rays) {
      const mirrorIdx = mirror
        ? ray.hitObjects.findIndex((r, i) => i > 0 && r === mirror)
        : -1;
      const splitAt = mirrorIdx > 0 ? mirrorIdx : ray.path.length - 1;

      // Forward path
      ctx.beginPath();
      const p0 = toScreen(ray.path[0][0], ray.path[0][1]);
      ctx.moveTo(p0[0], p0[1]);
      for (let i = 1; i <= splitAt; i++) {
        const p = toScreen(ray.path[i][0], ray.path[i][1]);
        ctx.lineTo(p[0], p[1]);
      }
      ctx.strokeStyle = ray.color;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Return path (orange), only when mirror was hit
      if (mirrorIdx > 0 && mirrorIdx < ray.path.length - 1) {
        ctx.beginPath();
        const pm = toScreen(ray.path[mirrorIdx][0], ray.path[mirrorIdx][1]);
        ctx.moveTo(pm[0], pm[1]);
        for (let i = mirrorIdx + 1; i < ray.path.length; i++) {
          const p = toScreen(ray.path[i][0], ray.path[i][1]);
          ctx.lineTo(p[0], p[1]);
        }
        ctx.strokeStyle = RETURN_COLOR;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    ctx.restore();
  // FIX B3: include readout in dependency array so pivot marker always redraws
  }, [viewSize, state, crystals, rays, readout, mirror, dpr]);

  useLayoutEffect(() => {
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
    drawWithState(overriddenState, canvas, viewSize, crystals, rays, readout, mirror);
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

    // Mirror
    if (mirror) {
      const pts = mirror.getCorners().map(p => toScreen(p[0], p[1]));
      const pointsStr = pts.map(p => p.join(',')).join(' ');
      svgContent.push(`<polygon points="${pointsStr}" stroke="#f97316" stroke-width="3" fill="rgba(249,115,22,0.18)" />`);
    }

    // Rays (split at mirror hit for color)
    const SVG_RETURN_COLOR = '#f97316';
    for (const ray of rays) {
      const mirrorIdx = mirror
        ? ray.hitObjects.findIndex((r, i) => i > 0 && r === mirror)
        : -1;
      const splitAt = mirrorIdx > 0 ? mirrorIdx : ray.path.length - 1;

      // Forward path
      const fwdPts = ray.path.slice(0, splitAt + 1).map(p => toScreen(p[0], p[1]));
      svgContent.push(`<polyline points="${fwdPts.map(p => p.join(',')).join(' ')}" stroke="${ray.color}" stroke-width="1" fill="none" />`);

      // Return path
      if (mirrorIdx > 0 && mirrorIdx < ray.path.length - 1) {
        const retPts = ray.path.slice(mirrorIdx).map(p => toScreen(p[0], p[1]));
        svgContent.push(`<polyline points="${retPts.map(p => p.join(',')).join(' ')}" stroke="${SVG_RETURN_COLOR}" stroke-width="1" fill="none" />`);
      }
    }

    // Origin marker (Pivot Point)
    const cp = toScreen(readout.pivotMarkerPos[0], readout.pivotMarkerPos[1]);
    svgContent.push(`<line x1="${cp[0] - 8}" y1="${cp[1] - 8}" x2="${cp[0] + 8}" y2="${cp[1] + 8}" stroke="#eab308" stroke-width="2.5" />`);
    svgContent.push(`<line x1="${cp[0] + 8}" y1="${cp[1] - 8}" x2="${cp[0] - 8}" y2="${cp[1] + 8}" stroke="#eab308" stroke-width="2.5" />`);
    svgContent.push(`<circle cx="${cp[0]}" cy="${cp[1]}" r="3" fill="#eab308" />`);

    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  ${svgContent.join('\n  ')}\n</svg>`;
  }, [viewSize, state, crystals, rays, readout, mirror]);

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

      {/* Floating Controls - Dragable & Minimisable */}
      <div
        style={{
          transform: `translate(${controlsPos.x}px, ${controlsPos.y}px)`,
        }}
        className={cn(
          "absolute top-6 left-6 flex items-center shadow-2xl rounded-lg p-1.5 border backdrop-blur-sm transition-colors duration-300 z-30 pointer-events-auto select-none",
          state.isLightMode ? "bg-white/95 border-gray-200 text-gray-800" : "bg-zinc-900/95 border-zinc-800 text-gray-200"
        )}
      >
        {/* Drag Handle */}
        <div
          onMouseDown={handleControlsDrag}
          onDoubleClick={() => setControlsPos({ x: 0, y: 0 })}
          className="flex items-center gap-1.5 px-2 py-1 cursor-move rounded hover:bg-gray-500/10 active:bg-gray-500/20 mr-1"
          title="Drag to move. Double-click to reset position."
        >
          <GripHorizontal className="w-3.5 h-3.5 opacity-60 text-emerald-500" />
          {controlsMinimized && (
            <span className="text-[10px] uppercase font-bold tracking-wide text-emerald-500 mr-1">Controls</span>
          )}
        </div>

        {/* Buttons List */}
        {!controlsMinimized && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => updateState('uiVisible', !state.uiVisible)}
              className={cn(
                "px-2.5 py-1 rounded border transition-all text-xs font-semibold flex items-center cursor-pointer",
                state.isLightMode 
                  ? "bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700" 
                  : "bg-zinc-805 hover:bg-zinc-700 border-zinc-700 text-gray-200"
              )}
              title="Toggle Sidebar UI"
            >
              {state.uiVisible ? <ChevronLeft size={13} className="mr-1" /> : <ChevronRight size={13} className="mr-1" />}
              UI
            </button>
            <button
              onClick={() => updateState('isLightMode', !state.isLightMode)}
              className={cn(
                "px-2.5 py-1 rounded border transition-all text-xs font-semibold flex items-center cursor-pointer",
                state.isLightMode 
                  ? "bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700" 
                  : "bg-zinc-805 hover:bg-zinc-700 border-zinc-700 text-gray-200"
              )}
              title="Toggle Day/Night Theme"
            >
              {state.isLightMode ? <Moon size={13} className="mr-1" /> : <Sun size={13} className="mr-1" />}
              Theme
            </button>
            <button
              onClick={() => updateState('showGrid', !state.showGrid)}
              className={cn(
                "px-2.5 py-1 rounded border transition-all text-xs font-semibold flex items-center cursor-pointer",
                state.showGrid 
                  ? "bg-blue-600 border-blue-400 text-white" 
                  : (state.isLightMode ? "bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700" : "bg-zinc-805 hover:bg-zinc-700 border-zinc-700 text-gray-200")
              )}
              title="Toggle Background Grid"
            >
              <Grid size={13} className="mr-1" />
              Grid
            </button>
            <button
              onClick={() => updateState('showAxes', !state.showAxes)}
              className={cn(
                "px-2.5 py-1 rounded border transition-all text-xs font-semibold flex items-center cursor-pointer",
                state.showAxes 
                  ? "bg-blue-600 border-blue-400 text-white" 
                  : (state.isLightMode ? "bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700" : "bg-zinc-805 hover:bg-zinc-700 border-zinc-700 text-gray-200")
              )}
              title="Toggle Coordinate Axes"
            >
              <Crosshair size={13} className="mr-1" />
              Axes
            </button>
            <button
              onClick={handleExportSVG}
              className={cn(
                "px-2.5 py-1 rounded border transition-all text-xs font-semibold flex items-center cursor-pointer",
                state.isLightMode 
                  ? "bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700" 
                  : "bg-zinc-805 hover:bg-zinc-700 border-zinc-700 text-gray-200"
              )}
              title="Export Vector SVG Drawing"
            >
              <Download size={13} className="mr-1" />
              Export SVG
            </button>
          </div>
        )}

        {/* Minimize Button */}
        <button
          onClick={() => setControlsMinimized(!controlsMinimized)}
          className={cn(
            "p-1 rounded ml-1 transition-colors cursor-pointer",
            state.isLightMode ? "hover:bg-gray-250 text-gray-650" : "hover:bg-zinc-800 text-zinc-400"
          )}
          title={controlsMinimized ? "Expand Screen Controls" : "Minimize Screen Controls"}
        >
          {controlsMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Standalone draw function used during mousemove panning so we can draw with
// a temporary pan offset without triggering React state updates.
// ---------------------------------------------------------------------------
function drawWithState(state, canvas, viewSize, crystals, rays, readout, mirror) {
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

  // Mirror
  if (mirror) {
    const pts = mirror.getCorners().map(p => toScreen(p[0], p[1]));
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < 4; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = 'rgba(249, 115, 22, 0.18)';
    ctx.fill();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  const RETURN_COLOR = '#f97316';
  for (const ray of rays) {
    const mirrorIdx = mirror
      ? ray.hitObjects.findIndex((r, i) => i > 0 && r === mirror)
      : -1;
    const splitAt = mirrorIdx > 0 ? mirrorIdx : ray.path.length - 1;

    ctx.beginPath();
    const p0 = toScreen(ray.path[0][0], ray.path[0][1]);
    ctx.moveTo(p0[0], p0[1]);
    for (let i = 1; i <= splitAt; i++) {
      const p = toScreen(ray.path[i][0], ray.path[i][1]);
      ctx.lineTo(p[0], p[1]);
    }
    ctx.strokeStyle = ray.color;
    ctx.lineWidth = 1;
    ctx.stroke();

    if (mirrorIdx > 0 && mirrorIdx < ray.path.length - 1) {
      ctx.beginPath();
      const pm = toScreen(ray.path[mirrorIdx][0], ray.path[mirrorIdx][1]);
      ctx.moveTo(pm[0], pm[1]);
      for (let i = mirrorIdx + 1; i < ray.path.length; i++) {
        const p = toScreen(ray.path[i][0], ray.path[i][1]);
        ctx.lineTo(p[0], p[1]);
      }
      ctx.strokeStyle = RETURN_COLOR;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  ctx.restore();
}

export default SimulatorCanvas;
