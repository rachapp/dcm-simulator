import React, { useEffect, useRef, useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, Sun, Moon, Grid } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const SimulatorCanvas = ({ 
  state, 
  updateState, 
  crystals, 
  rays, 
  readout 
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [viewSize, setViewSize] = useState({ width: 0, height: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = viewSize;
    if (width === 0 || height === 0) return;

    ctx.clearRect(0, 0, width, height);

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
      const endX = Math.ceil(physMaxX / 10) * 10;
      const startY = Math.floor(physMinY / 10) * 10;
      const endY = Math.ceil(physMaxY / 10) * 10;

      ctx.beginPath();
      ctx.strokeStyle = state.isLightMode ? '#d1d5db' : '#1f2937';
      ctx.lineWidth = 1;
      for (let x = startX; x <= endX; x += 10) {
        let p1 = toScreen(x, physMinY);
        let p2 = toScreen(x, physMaxY);
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
      }
      for (let y = startY; y <= endY; y += 10) {
        let p1 = toScreen(physMinX, y);
        let p2 = toScreen(physMaxX, y);
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
      }
      ctx.stroke();
    }

    // Axes
    ctx.beginPath();
    ctx.strokeStyle = state.isLightMode ? '#9ca3af' : '#374151';
    ctx.lineWidth = 1;
    const xLeft = toScreen(physMinX, 0);
    const xRight = toScreen(physMaxX, 0);
    ctx.moveTo(xLeft[0], xLeft[1]);
    ctx.lineTo(xRight[0], xRight[1]);
    const yTop = toScreen(0, physMaxY);
    const yBot = toScreen(0, physMinY);
    ctx.moveTo(yTop[0], yTop[1]);
    ctx.lineTo(yBot[0], yBot[1]);
    ctx.stroke();

    // Origin marker (Pivot Point)
    ctx.beginPath();
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
        for(let i=1; i<4; i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.closePath();
        ctx.strokeStyle = state.isLightMode ? '#4b5563' : '#e5e7eb';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const rx = rect.rotation_center ? rect.rotation_center[0] : rect.x + rect.w/2;
        const ry = rect.rotation_center ? rect.rotation_center[1] : rect.y + rect.h/2;
        const cp = toScreen(rx, ry);
        ctx.beginPath();
        ctx.moveTo(cp[0] - 4, cp[1] - 4); ctx.lineTo(cp[0] + 4, cp[1] + 4);
        ctx.moveTo(cp[0] + 4, cp[1] - 4); ctx.lineTo(cp[0] - 4, cp[1] + 4);
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
  }, [viewSize, state, crystals, rays]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setViewSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [state.uiVisible]);

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const factor = e.deltaY < 0 ? (1 + zoomSpeed) : 1 / (1 + zoomSpeed);
    const newZoom = Math.max(0.1, Math.min(state.zoom * factor, 10));
    updateState('zoom', newZoom);
  };

  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };

    const viewW = 300; 
    const viewH = 150; 
    const baseScale = Math.min(viewSize.width / viewW, viewSize.height / viewH) * 0.95;
    const scale = baseScale * state.zoom;

    updateState({
      viewCenterX: state.viewCenterX - dx / scale,
      viewCenterY: state.viewCenterY + dy / scale
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  return (
    <div className="flex-1 relative bg-black overflow-hidden" ref={containerRef}>
      <canvas
        ref={canvasRef}
        width={viewSize.width}
        height={viewSize.height}
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
      </div>
    </div>
  );
};

export default SimulatorCanvas;
