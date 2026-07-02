import React from 'react';
import { GripHorizontal, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '../utils';

const ReadoutOverlay = ({ state, updateState, readout }) => {
  const [det1Local, setDet1Local] = React.useState(state.det1X);
  const [det2Local, setDet2Local] = React.useState(state.det2X);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [panelWidth, setPanelWidth] = React.useState(288);

  const handleResizeMouseDown = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    const startWidth = panelWidth;
    const startX = mouseDownEvent.clientX;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(240, Math.min(500, startWidth - deltaX));
      setPanelWidth(newWidth);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleHeaderMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) return;

    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const initX = position.x;
    const initY = position.y;

    const onMouseMove = (moveEvent) => {
      setPosition({
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

  const handleDoubleClick = () => {
    setPosition({ x: 0, y: 0 });
    setPanelWidth(288);
  };

  React.useEffect(() => {
    setDet1Local(state.det1X);
  }, [state.det1X]);

  React.useEffect(() => {
    setDet2Local(state.det2X);
  }, [state.det2X]);

  const handleDet1Change = (e) => {
    const raw = e.target.value;
    setDet1Local(raw);
    const val = parseFloat(raw);
    if (!isNaN(val)) updateState('det1X', val);
  };

  const handleDet2Change = (e) => {
    const raw = e.target.value;
    setDet2Local(raw);
    const val = parseFloat(raw);
    if (!isNaN(val)) updateState('det2X', val);
  };

  // ---------------------------------------------------------------------------
  // Auto-collimator derivations
  // ---------------------------------------------------------------------------
  const mr = readout.mirrorReadout;

  // ΔY: vertical displacement of return beam vs forward beam at Screen 1.
  const deltaY =
    mr && mr.returnY !== null && readout.yHit1 !== null
      ? mr.returnY - readout.yHit1
      : null;

  // ── PRIMARY MEASUREMENT ──────────────────────────────────────────────────
  // The return-beam angle is read from the actual direction of the last ray
  // segment (computed in App.jsx via asin(dy/len)).
  //
  // Full return-beam angle formula (small-angle, direct mirror hit):
  //   return_angle ≈ α  −  2·δ_m  +  2·(c2Pitch/1000)
  //   where α = input beam angle (mrad), δ_m = mirror tilt (mrad)
  //
  // AC reading must be RELATIVE to the input beam direction:
  //   AC = (return_angle + input_angle) / 2
  // Derivation: perfect retroreflection of input at α gives return at −α.
  //   AC = (return − (−α)) / 2 = (return + α) / 2
  //   When mirror ⊥ input (δ_m = α): return = −α → AC = 0  ✓
  //   When input is horizontal (α=0): AC = return/2          ✓ (original formula)
  // ---------------------------------------------------------------------------
  const returnAngleMrad = mr ? mr.returnAngleMrad : null; // from asin(dy/len)
  const inputAngleMrad  = state.rayAngle;                 // mrad (from state)

  // AC surface-tilt reading (corrected for input angle)
  const acReadingMrad = returnAngleMrad !== null
    ? (returnAngleMrad + inputAngleMrad) / 2
    : null;

  // Mirror's contribution to return beam angle (law of reflection, always −2×tilt,
  // independent of input angle).
  const mirrorContribMrad = -2 * state.mirrorAngle; // mrad

  // Crystal contribution to return beam angle.
  // Full formula: return = inputAngle + mirrorContrib + crystalContrib
  //   ⇒ crystalContrib = return − inputAngle − mirrorContrib  ≈  2 × c2Pitch(mrad)
  const crystalContribMrad =
    returnAngleMrad !== null
      ? returnAngleMrad - inputAngleMrad - mirrorContribMrad
      : null;

  // Inferred C2 pitch from crystal contribution (double-pass factor of 2):
  //   crystalContrib = 2 × c2Pitch(mrad) = 2 × c2Pitch(µrad) / 1000
  //   ⇒  c2Pitch(µrad) = crystalContrib(mrad) × 1000 / 2
  const inferredC2PitchUrad =
    crystalContribMrad !== null ? (crystalContribMrad * 1000) / 2 : null;

  // Difference between inferred and set C2 pitch (in µrad)
  const pitchResidualUrad =
    inferredC2PitchUrad !== null ? inferredC2PitchUrad - state.c2Pitch : null;

  return (
    <div
      className={cn(
        'absolute top-6 right-6 border shadow-2xl rounded-lg p-4 backdrop-blur-sm flex flex-col gap-3 z-10 pointer-events-auto transition-colors duration-300 select-none',
        state.isLightMode ? 'bg-white/90 border-gray-200 text-gray-800' : 'bg-gray-900/90 border-gray-800 text-gray-200'
      )}
      style={{
        width: `${panelWidth}px`,
        transform: `translate(${position.x}px, ${position.y}px)`
      }}
    >
      {/* Draggable Resize Border Strip */}
      {!isMinimized && (
        <div
          onMouseDown={handleResizeMouseDown}
          className="absolute top-0 left-0 w-1.5 h-full cursor-ew-resize hover:bg-emerald-500/35 bg-transparent transition-colors z-20 rounded-l-lg"
          title="Drag left/right to resize box width"
        />
      )}

      {/* Header bar (Draggable to move) */}
      <div
        onMouseDown={handleHeaderMouseDown}
        onDoubleClick={handleDoubleClick}
        className="flex justify-between items-center border-b pb-1.5 border-gray-700/50 cursor-move"
        title="Drag to move. Double-click to reset."
      >
        <div className="flex items-center gap-1.5">
          <GripHorizontal size={14} className="opacity-50 text-emerald-500" />
          <span className="text-xs uppercase tracking-wider font-bold text-emerald-500">
            Screen Readouts
          </span>
        </div>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className={cn(
            "hover:bg-gray-700/35 p-1 rounded transition cursor-pointer",
            state.isLightMode ? "text-gray-500 hover:text-gray-750" : "text-zinc-400 hover:text-zinc-200"
          )}
          title={isMinimized ? "Expand Panel" : "Minimize Panel"}
        >
          {isMinimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
        </button>
      </div>

      {!isMinimized && (
        <div className="flex flex-col gap-3.5 mt-1 overflow-x-hidden">
          {/* Screen 1 (Input) */}
      <div className={cn('border-b pb-3', state.isLightMode ? 'border-gray-100' : 'border-gray-700/50')}>
        <div className="flex justify-between items-center mb-1">
          <div className="text-xs text-blue-500 uppercase tracking-wider font-semibold">Screen 1 (upstream) y</div>
          <input
            type="number"
            step="any"
            className={cn(
              'border rounded px-2 py-0.5 text-xs text-right w-16 font-mono text-blue-500 outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto',
              state.isLightMode ? 'bg-white border-gray-200' : 'bg-gray-950 border-gray-700'
            )}
            value={det1Local}
            onChange={handleDet1Change}
            onBlur={() => setDet1Local(state.det1X)}
          />
        </div>
        <input
          type="range"
          min="-1000"
          max="0"
          step="1"
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-2"
          value={state.det1X}
          onChange={(e) => updateState('det1X', parseFloat(e.target.value))}
        />
        <div className={cn('font-mono font-bold text-sm', readout.yHit1 !== null ? 'text-blue-500' : 'text-gray-400')}>
          {readout.yHit1 !== null ? `Position = ${readout.yHit1.toFixed(3)} mm` : 'No Hit'}
        </div>
      </div>

      {/* Screen 2 (Output) */}
      <div className={cn('border-b pb-3', state.isLightMode ? 'border-gray-100' : 'border-gray-700/50')}>
        <div className="flex justify-between items-center mb-1">
          <div className="text-xs text-yellow-600 uppercase tracking-wider font-semibold">Screen 2 (downstream) y</div>
          <input
            type="number"
            step="any"
            className={cn(
              'border rounded px-2 py-0.5 text-xs text-right w-16 font-mono text-yellow-600 outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto',
              state.isLightMode ? 'bg-white border-gray-200' : 'bg-gray-950 border-gray-700'
            )}
            value={det2Local}
            onChange={handleDet2Change}
            onBlur={() => setDet2Local(state.det2X)}
          />
        </div>
        <input
          type="range"
          min="0"
          max="1000"
          step="1"
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500 mb-2"
          value={state.det2X}
          onChange={(e) => updateState('det2X', parseFloat(e.target.value))}
        />
        <div className={cn('font-mono font-bold text-sm', readout.yHit2 !== null ? 'text-yellow-600' : 'text-gray-400')}>
          {readout.yHit2 !== null ? `Position = ${readout.yHit2.toFixed(3)} mm` : 'No Hit'}
        </div>
      </div>

      {/* True Offset */}
      <div
        className={cn(
          state.mirrorEnabled ? 'border-b pb-3' : '',
          state.isLightMode ? 'border-gray-100' : 'border-gray-700/50'
        )}
      >
        <div className="text-xs text-green-600 uppercase tracking-wider font-semibold mb-1">Beam Offset (S2 − S1)</div>
        <div className={cn('font-mono font-bold text-lg', readout.trueOffset !== null ? 'text-green-600' : 'text-gray-400')}>
          {readout.trueOffset !== null ? `${readout.trueOffset.toFixed(3)} mm` : '--'}
        </div>
      </div>

      {/* ── Auto-Collimator Return Beam ───────────────────────────────────── */}
      {state.mirrorEnabled && (
        <div className="flex flex-col gap-2">
          <div className="text-xs text-orange-500 uppercase tracking-wider font-semibold flex items-center gap-1">
            <span>↩</span> Return Beam (Auto-Collimator)
          </div>

          <div
            className={cn(
              'rounded-lg p-3 border space-y-1.5',
              state.isLightMode ? 'bg-orange-50 border-orange-200' : 'bg-orange-950/30 border-orange-500/30'
            )}
          >
            {/* S1 return y */}
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">S1 return y</span>
              <span className={cn('font-mono font-bold text-sm', mr && mr.returnY !== null ? 'text-orange-400' : 'text-gray-500')}>
                {mr && mr.returnY !== null ? `${mr.returnY.toFixed(4)} mm` : 'No Return'}
              </span>
            </div>

            {/* ΔY */}
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">ΔY (return − fwd)</span>
              <span
                className={cn(
                  'font-mono font-bold text-sm',
                  deltaY !== null ? (Math.abs(deltaY) < 0.001 ? 'text-emerald-400' : 'text-rose-400') : 'text-gray-500'
                )}
              >
                {deltaY !== null ? `${deltaY >= 0 ? '+' : ''}${deltaY.toFixed(4)} mm` : '--'}
              </span>
            </div>

            {/* ── Return beam angle (primary measurement) ── */}
            <div className={cn('border-t pt-1.5 mt-0.5', state.isLightMode ? 'border-orange-200' : 'border-orange-500/20')} />

            <div className="text-[10px] text-orange-400 uppercase tracking-wider font-semibold">
              Return beam angle
            </div>
            {/* Measured return beam angle from actual ray direction */}
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Measured</span>
              <span className={cn('font-mono font-bold text-sm', returnAngleMrad !== null ? 'text-orange-300' : 'text-gray-500')}>
                {returnAngleMrad !== null ? `${returnAngleMrad.toFixed(4)} mrad` : '--'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider"> </span>
              <span className={cn('font-mono text-xs', state.isLightMode ? 'text-gray-600' : 'text-gray-400')}>
                {returnAngleMrad !== null ? `= ${(returnAngleMrad * 1000).toFixed(2)} µrad` : '--'}
              </span>
            </div>

            {/* ── Autocollimator reading: surface tilt = (return + input) / 2 ── */}
            {acReadingMrad !== null && (
              <div className={cn(
                'mt-1 rounded-md px-3 py-2 border',
                state.isLightMode
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-amber-950/40 border-amber-500/40'
              )}>
                <div className={cn('text-[10px] uppercase tracking-wider font-bold mb-1',
                  state.isLightMode ? 'text-amber-700' : 'text-amber-400'
                )}>
                  AC reading (angle ÷ 2)
                </div>
                <div className="text-[9px] text-gray-500 mb-1.5 leading-tight">
                  (return + input) / 2 &mdash; 0 when mirror &perp; beam
                </div>
                <div className="flex justify-between items-center">
                  <span className={cn('font-mono font-bold text-base',
                    state.isLightMode ? 'text-amber-700' : 'text-amber-300'
                  )}>
                    {acReadingMrad.toFixed(4)} mrad
                  </span>
                  <span className={cn('font-mono text-xs',
                    state.isLightMode ? 'text-amber-600' : 'text-amber-400'
                  )}>
                    {(acReadingMrad * 1000).toFixed(2)} µrad
                  </span>
                </div>
              </div>
            )}

            {/* ── Decomposition ── */}
            <div className={cn('border-t pt-1.5 mt-0.5', state.isLightMode ? 'border-orange-200' : 'border-orange-500/20')} />

            <div className="text-[10px] text-orange-400 uppercase tracking-wider font-semibold">
              Angle decomposition
            </div>

            {/* Mirror contribution */}
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Mirror (−2×tilt)</span>
              <span className={cn('font-mono text-xs', state.isLightMode ? 'text-gray-700' : 'text-gray-300')}>
                {mirrorContribMrad.toFixed(4)} mrad
              </span>
            </div>

            {/* Crystal contribution (inferred) */}
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Crystal (inferred)</span>
              <span className={cn('font-mono text-xs', state.isLightMode ? 'text-gray-700' : 'text-gray-300')}>
                {crystalContribMrad !== null ? `${crystalContribMrad.toFixed(4)} mrad` : '--'}
              </span>
            </div>

            {/* ── C2 pitch comparison ── */}
            <div className={cn('border-t pt-1.5 mt-0.5', state.isLightMode ? 'border-orange-200' : 'border-orange-500/20')} />

            <div className="text-[10px] text-orange-400 uppercase tracking-wider font-semibold">
              C2 pitch comparison
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Set (c2Pitch)</span>
              <span className={cn('font-mono text-xs', state.isLightMode ? 'text-gray-700' : 'text-gray-300')}>
                {state.c2Pitch.toFixed(1)} µrad
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">Inferred (÷2)</span>
              <span className={cn('font-mono text-xs', state.isLightMode ? 'text-gray-700' : 'text-gray-300')}>
                {inferredC2PitchUrad !== null ? `${inferredC2PitchUrad.toFixed(2)} µrad` : '--'}
              </span>
            </div>

            {/* Agreement badge */}
            {pitchResidualUrad !== null && (
              <div
                className={cn(
                  'text-center text-[10px] font-bold py-1 rounded mt-1',
                  Math.abs(pitchResidualUrad) < 1
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/15 text-rose-400'
                )}
              >
                {Math.abs(pitchResidualUrad) < 1
                  ? '✓ Crystals Parallel'
                  : `Δ = ${pitchResidualUrad >= 0 ? '+' : ''}${pitchResidualUrad.toFixed(2)} µrad`}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  );
};

export default ReadoutOverlay;
