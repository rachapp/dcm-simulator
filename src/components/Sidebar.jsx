import React from 'react';
import { Settings, Zap, RotateCw, Move, Maximize, Layers, Sliders, Info, ArrowLeftRight, Play, Pause, Square, Activity } from 'lucide-react';
import ControlSection from './ControlSection';
import ControlItem from './ControlItem';
import { PRESETS } from '../engine';
import { cn } from '../utils';

const Sidebar = ({ state, setState, updateState, energy, handleEnergyChange, physics, snapToPivot }) => {
  const [motionTimeLocal, setMotionTimeLocal] = React.useState((state.scanMotionTime ?? 500).toString());
  const [dwellTimeLocal, setDwellTimeLocal] = React.useState((state.scanDwellTime ?? 300).toString());

  React.useEffect(() => {
    setMotionTimeLocal((state.scanMotionTime ?? 500).toString());
  }, [state.scanMotionTime]);

  React.useEffect(() => {
    setDwellTimeLocal((state.scanDwellTime ?? 300).toString());
  }, [state.scanDwellTime]);

  return (
    <div className={cn(
      "border-r flex flex-col shadow-2xl z-10 shrink-0 transition-all duration-300 ease-in-out h-full",
      state.uiVisible ? "w-80" : "w-0 overflow-hidden border-none",
      state.isLightMode ? "bg-white border-gray-200" : "bg-gray-900 border-gray-800"
    )}>
      <div className={cn(
        "p-5 border-b shrink-0",
        state.isLightMode ? "bg-white border-gray-200" : "bg-gray-900 border-gray-800"
      )}>
        <h1 className="text-xl font-bold text-blue-400 tracking-wide">DCM Simulator</h1>
        <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">X-ray Optics & Geometry</p>
      </div>

      <div className={cn(
        "p-5 flex-1 overflow-y-auto space-y-6 scrollbar-thin",
        state.isLightMode ? "scrollbar-thumb-gray-300" : "scrollbar-thumb-gray-700"
      )}>
        
        {/* Bragg Optics & Energy */}
        <ControlSection 
          title="Bragg OPTICS" 
          icon={Zap} 
          className={cn(
            "border-blue-500/30",
            state.isLightMode ? "bg-blue-50/50" : "bg-blue-900/10"
          )}
          titleColor="text-blue-500"
          iconColor="text-blue-500"
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className={cn("text-xs", state.isLightMode ? "text-blue-600" : "text-blue-200")}>Crystal Pair</label>
              <select 
                className={cn(
                  "border rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500",
                  state.isLightMode ? "bg-white border-gray-300 text-blue-600" : "bg-gray-950 border-gray-700 text-blue-300"
                )}
                value={state.crystalType}
                onChange={(e) => {
                  const type = e.target.value;
                  const d = type === 'custom' ? state.dSpacing : PRESETS[type];
                  updateState({ crystalType: type, dSpacing: d });
                }}
              >
                <option value="Si111">Si (111)</option>
                <option value="Si220">Si (220)</option>
                <option value="Si311">Si (311)</option>
                <option value="Ge111">Ge (111)</option>
                <option value="custom">Custom...</option>
              </select>
            </div>
            
            <div className="flex justify-between items-center">
              <label className={cn("text-xs", state.isLightMode ? "text-blue-600" : "text-blue-200")}>d-spacing (Å)</label>
              <input 
                type="number" 
                className={cn(
                  "border rounded px-2 py-0.5 text-xs text-right w-20 font-mono disabled:opacity-50",
                  state.isLightMode ? "bg-white border-gray-300 text-blue-600" : "bg-gray-950 border-gray-700 text-blue-400"
                )}
                value={state.dSpacing}
                disabled={state.crystalType !== 'custom'}
                onChange={(e) => updateState('dSpacing', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="pt-2 border-t border-blue-500/20">
              <ControlItem 
                label="Energy" 
                unit="keV"
                value={energy}
                min={1} 
                max={80} 
                step={0.1}
                onChange={handleEnergyChange}
                valueClassName="text-yellow-600 font-bold"
                labelClassName={state.isLightMode ? "text-yellow-700 font-semibold" : "text-yellow-400 font-semibold"}
                isLightMode={state.isLightMode}
              />
              <div className="flex justify-between items-center mt-2">
                <label className="text-xs text-gray-400">Wavelength (Å)</label>
                <span className={cn("text-xs font-mono", state.isLightMode ? "text-gray-600" : "text-gray-300")}>
                  {physics.lambda > 0 ? physics.lambda.toFixed(4) : '--'}
                </span>
              </div>
            </div>
          </div>
        </ControlSection>

        {/* Goniometer Angle */}
        <ControlSection title="Goniometer Angle" icon={RotateCw} isLightMode={state.isLightMode}>
          <div className="flex justify-between gap-2 mb-4">
            <div className={cn(
              "flex-1 text-center border rounded p-2 shadow-inner",
              state.isLightMode ? "bg-gray-50 border-gray-200" : "bg-gray-950 border-gray-800"
            )}>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Goniometer</div>
              <div className="font-mono text-xl font-bold text-green-500">{state.rectRotation.toFixed(3)}°</div>
            </div>
            <div className={cn(
              "flex-1 text-center border rounded p-2 shadow-inner",
              state.isLightMode ? "bg-gray-50 border-gray-200" : "bg-gray-950 border-gray-800"
            )}>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">True Bragg</div>
              <div className="font-mono text-xl font-bold text-blue-500">{physics.trueBraggDeg.toFixed(3)}°</div>
            </div>
          </div>
          <ControlItem 
            label="Angle θ" 
            unit="°"
            value={state.rectRotation}
            min={0} 
            max={89} 
            step={0.001}
            onChange={(v) => updateState('rectRotation', v)}
            valueClassName="text-green-500"
            isLightMode={state.isLightMode}
          />
          
          <div className={cn("pt-2 border-t", state.isLightMode ? "border-gray-200" : "border-gray-700/50")}>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-gray-400 flex items-center">
                Ray Angle Offset (mrad)
                <button 
                  onClick={() => updateState('autoRayOffset', !state.autoRayOffset)}
                  className={cn(
                    "ml-2 text-[10px] px-2 py-0.5 rounded border transition-colors focus:outline-none",
                    state.autoRayOffset 
                      ? "border-blue-500 bg-blue-900/50 text-blue-300" 
                      : (state.isLightMode ? "border-gray-300 bg-gray-100 text-gray-600" : "border-gray-600 bg-gray-800 text-gray-400 hover:text-white")
                  )}
                >
                  Auto: {state.autoRayOffset ? "ON" : "OFF"}
                </button>
              </label>
            </div>
            <ControlItem 
              label=""
              value={state.rayAngleOffset}
              min={-35} 
              max={35} 
              step={0.1}
              disabled={state.autoRayOffset}
              onChange={(v) => updateState('rayAngleOffset', v)}
              valueClassName="text-cyan-600"
              isLightMode={state.isLightMode}
            />
          </div>
        </ControlSection>

        {/* Ray Source */}
        <ControlSection title="Ray Source" icon={Settings} isLightMode={state.isLightMode}>
          <ControlItem 
            label="Beam Height" 
            unit="mm"
            value={state.beamSize}
            min={0} 
            max={10} 
            step={0.1}
            onChange={(v) => updateState('beamSize', v)}
            valueClassName="text-cyan-600"
            isLightMode={state.isLightMode}
          />
          <ControlItem 
            label="Beam Divergence" 
            unit="µrad"
            value={state.divergence}
            min={0} 
            max={500} 
            step={1}
            onChange={(v) => updateState('divergence', v)}
            valueClassName="text-cyan-600"
            isLightMode={state.isLightMode}
          />
          <ControlItem 
            label="Number of Rays" 
            value={state.numRays}
            min={1} 
            max={51} 
            step={1}
            onChange={(v) => updateState('numRays', v)}
            valueClassName="text-cyan-600"
            isLightMode={state.isLightMode}
          />
          <ControlItem 
            label="Start X" 
            unit="mm"
            value={state.startX}
            min={-2000} 
            max={0} 
            step={10}
            onChange={(v) => updateState('startX', v)}
            isLightMode={state.isLightMode}
          />
          <ControlItem 
            label="Start Y" 
            unit="mm"
            value={state.startY}
            min={-100} 
            max={100} 
            step={1}
            onChange={(v) => updateState('startY', v)}
            isLightMode={state.isLightMode}
          />
          <ControlItem 
            label="Beam Angle" 
            unit="mrad"
            value={state.rayAngle}
            min={-35} 
            max={35} 
            step={0.1}
            onChange={(v) => updateState('rayAngle', v)}
            valueClassName="text-cyan-600"
            isLightMode={state.isLightMode}
          />
        </ControlSection>

        {/* Crystal Sizes */}
        <ControlSection title="Crystal Sizes" icon={Maximize} isLightMode={state.isLightMode}>
          <ControlItem 
            label="C1 Length" 
            unit="mm"
            value={state.c1Len}
            min={5} 
            max={1000} 
            step={1}
            onChange={(v) => updateState('c1Len', v)}
            valueClassName="text-pink-600"
            isLightMode={state.isLightMode}
          />
          <ControlItem 
            label="C2 Length" 
            unit="mm"
            value={state.c2Len}
            min={10} 
            max={1000} 
            step={1}
            onChange={(v) => updateState('c2Len', v)}
            valueClassName="text-pink-600"
            isLightMode={state.isLightMode}
          />
          <ControlItem 
            label="C1 & C2 Thickness" 
            unit="mm"
            value={state.thickness}
            min={1} 
            max={1000} 
            step={1}
            onChange={(v) => updateState('thickness', v)}
            valueClassName="text-pink-600"
            isLightMode={state.isLightMode}
          />
        </ControlSection>

        {/* Global Stage Offset */}
        <ControlSection title="Global Stage Offset" icon={Move} isLightMode={state.isLightMode}>
          <div className="flex justify-between items-center mb-4">
            <label className="text-xs text-gray-400">Rotation Center</label>
            <div className={cn(
              "flex p-0.5 rounded border",
              state.isLightMode ? "bg-gray-100 border-gray-200" : "bg-gray-950 border-gray-800"
            )}>
              <button 
                onClick={() => snapToPivot('C1')}
                className={cn(
                  "px-3 py-1 rounded text-[10px] font-bold transition-all",
                  state.rotationCenterMode === 'C1' 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : (state.isLightMode ? "text-gray-500 hover:text-gray-700" : "text-gray-500 hover:text-gray-300")
                )}
              >
                C1
              </button>
              <button 
                onClick={() => snapToPivot('C2')}
                className={cn(
                  "px-3 py-1 rounded text-[10px] font-bold transition-all",
                  state.rotationCenterMode === 'C2' 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : (state.isLightMode ? "text-gray-500 hover:text-gray-700" : "text-gray-500 hover:text-gray-300")
                )}
              >
                C2
              </button>
            </div>
          </div>
          <ControlItem 
            label="Global X" 
            unit="mm"
            value={state.globalX}
            min={-1000} 
            max={1000} 
            step={1}
            onChange={(v) => updateState('globalX', v)}
            valueClassName="text-teal-600"
            isLightMode={state.isLightMode}
          />
          <ControlItem 
            label="Global Y" 
            unit="mm"
            value={state.globalY}
            min={-100} 
            max={100} 
            step={0.1}
            onChange={(v) => updateState('globalY', v)}
            valueClassName="text-teal-600"
            isLightMode={state.isLightMode}
          />
          <ControlItem 
            label="Global Pitch" 
            unit="mrad"
            value={state.globalPitch}
            min={-100} 
            max={100} 
            step={0.1}
            onChange={(v) => updateState('globalPitch', v)}
            valueClassName="text-teal-600"
            isLightMode={state.isLightMode}
          />
        </ControlSection>

        {/* Crystal 1 Stage */}
        <ControlSection 
          title={state.rotationCenterMode === 'C1' ? "Crystal 1 Stage (Fixed)" : "Crystal 1 Stage"} 
          icon={Layers} 
          isLightMode={state.isLightMode}
          className={state.rotationCenterMode === 'C1' ? "border-green-500/20 bg-green-900/5" : ""}
        >
          <ControlItem 
            label="Horizontal (X)" 
            unit="mm"
            value={state.c1X}
            min={-1000} 
            max={1000} 
            step={0.1}
            onChange={(v) => updateState('c1X', v)}
            valueClassName="text-orange-600"
            isLightMode={state.isLightMode}
          />
          
          {state.rotationCenterMode === 'C1' ? (
            <ControlItem 
              label="Vertical (Y)" 
              unit="mm"
              value={state.c1Y}
              min={-1000} 
              max={1000} 
              step={0.1}
              onChange={(v) => updateState('c1Y', v)}
              valueClassName="text-orange-600"
              isLightMode={state.isLightMode}
            />
          ) : (
            <div className={cn("pt-2 border-t", state.isLightMode ? "border-gray-200" : "border-gray-700/50")}>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-gray-400 flex items-center">
                  Crystal Gap (Y)
                  <button 
                    onClick={() => updateState('autoGap', !state.autoGap)}
                    className={cn(
                      "ml-2 text-[10px] px-2 py-0.5 rounded border transition-colors focus:outline-none",
                      state.autoGap 
                        ? "border-blue-500 bg-blue-900/50 text-blue-300" 
                        : (state.isLightMode ? "border-gray-300 bg-gray-100 text-gray-600" : "border-gray-600 bg-gray-800 text-gray-400 hover:text-white")
                    )}
                  >
                    Auto: {state.autoGap ? "ON" : "OFF"}
                  </button>
                </label>
              </div>
              <ControlItem 
                label=""
                unit="mm"
                value={state.c1Y}
                min={-1000} 
                max={1000} 
                step={0.1}
                disabled={state.autoGap}
                onChange={(v) => updateState('c1Y', v)}
                valueClassName="text-orange-600"
                isLightMode={state.isLightMode}
              />
              {state.autoGap && (
                <div className={cn(
                  "p-3 rounded border mt-2",
                  state.isLightMode ? "bg-indigo-50 border-indigo-200" : "bg-indigo-900/20 border-indigo-500/30"
                )}>
                  <ControlItem 
                    label="Fixed Beam Offset h" 
                    unit="mm"
                    value={state.offsetH}
                    min={0} 
                    max={1000} 
                    step={0.1}
                    onChange={(v) => updateState('offsetH', v)}
                    valueClassName="text-indigo-600"
                    isLightMode={state.isLightMode}
                  />
                </div>
              )}
            </div>
          )}
        </ControlSection>

        {/* Crystal 2 Stage */}
        <ControlSection 
          title={state.rotationCenterMode === 'C2' ? "Crystal 2 Stage (Fixed)" : "Crystal 2 Stage"} 
          icon={Sliders} 
          isLightMode={state.isLightMode}
          className={state.rotationCenterMode === 'C2' ? "border-green-500/20 bg-green-900/5" : ""}
        >
          {/* ── Horizontal (X) with Auto mode ── */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-gray-400 flex items-center">
                Horizontal (X)
                <button
                  onClick={() => updateState('autoC2X', !state.autoC2X)}
                  className={cn(
                    "ml-2 text-[10px] px-2 py-0.5 rounded border transition-colors focus:outline-none",
                    state.autoC2X
                      ? "border-violet-500 bg-violet-900/50 text-violet-300"
                      : (state.isLightMode ? "border-gray-300 bg-gray-100 text-gray-600" : "border-gray-600 bg-gray-800 text-gray-400 hover:text-white")
                  )}
                >
                  Auto: {state.autoC2X ? "ON" : "OFF"}
                </button>
              </label>
            </div>

            <ControlItem
              label=""
              unit="mm"
              value={state.c2X}
              min={state.autoC2X ? state.c2XMin : -1000}
              max={state.autoC2X ? state.c2XMax : 1000}
              step={0.1}
              disabled={state.autoC2X}
              onChange={(v) => updateState('c2X', v)}
              valueClassName="text-purple-600"
              isLightMode={state.isLightMode}
            />

            {/* Range limits panel — shown only when auto is ON */}
            {state.autoC2X && (
              <div className={cn(
                "mt-2 p-3 rounded-lg border space-y-3",
                state.isLightMode
                  ? "bg-violet-50 border-violet-200"
                  : "bg-violet-900/20 border-violet-500/30"
              )}>
                {/* Formula hint + live value + clamp warning */}
                <div className={cn(
                  "text-[10px] font-mono px-2 py-1.5 rounded space-y-0.5",
                  state.isLightMode ? "bg-violet-100 text-violet-700" : "bg-violet-950/60 text-violet-300"
                )}>
                  <div className="flex justify-between items-center">
                    <span>X = (Gap − 2·C1Y)/tan θ − Y_gl/sin θ</span>
                    {(() => {
                      const thetaRad = (
                        state.rectRotation
                        + (state.globalPitch    / 1000) * (180 / Math.PI)
                        - (state.rayAngleOffset / 1000) * (180 / Math.PI)
                      ) * Math.PI / 180;
                      const tanT = Math.tan(thetaRad);
                      if (Math.abs(tanT) < 0.001) return null;
                      const raw = (state.c2Y - 2 * state.c1Y) / tanT - state.globalY / Math.sin(thetaRad);
                      const isClamped = raw < state.c2XMin || raw > state.c2XMax;
                      return isClamped ? (
                        <span className="text-amber-400 font-sans">&#9888; clamped</span>
                      ) : null;
                    })()}
                  </div>
                  {/* Show the live unclamped value */}
                  {(() => {
                    const thetaRad = (
                      state.rectRotation
                      + (state.globalPitch    / 1000) * (180 / Math.PI)
                      - (state.rayAngleOffset / 1000) * (180 / Math.PI)
                    ) * Math.PI / 180;
                    const tanT = Math.tan(thetaRad);
                    if (Math.abs(tanT) < 0.001) return null;
                    const raw = (state.c2Y - 2 * state.c1Y) / tanT - state.globalY / Math.sin(thetaRad);
                    return (
                      <div className={cn(
                        "text-[9px] opacity-70",
                        state.isLightMode ? "text-violet-600" : "text-violet-400"
                      )}>
                        ideal = {raw.toFixed(2)} mm{raw < state.c2XMin || raw > state.c2XMax ? ` (range: ${state.c2XMin}–${state.c2XMax})` : ''}
                      </div>
                    );
                  })()}
                </div>

                {/* Physical stage range inputs */}
                <div>
                  <div className={cn(
                    "text-[10px] uppercase tracking-wider mb-2",
                    state.isLightMode ? "text-violet-600" : "text-violet-400"
                  )}>
                    Physical Stage Range
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="text-[10px] text-gray-500 mb-1">Min (mm)</div>
                      <input
                        type="number"
                        step="any"
                        aria-label="C2 horizontal stage minimum"
                        className={cn(
                          "w-full border rounded px-2 py-1 text-xs font-mono text-right outline-none focus:border-violet-500",
                          state.isLightMode
                            ? "bg-white border-gray-300 text-violet-700"
                            : "bg-gray-950 border-gray-700 text-violet-300"
                        )}
                        value={state.c2XMin}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) updateState('c2XMin', val);
                        }}
                      />
                    </div>
                    <span className="text-gray-500 text-xs mt-4">→</span>
                    <div className="flex-1">
                      <div className="text-[10px] text-gray-500 mb-1">Max (mm)</div>
                      <input
                        type="number"
                        step="any"
                        aria-label="C2 horizontal stage maximum"
                        className={cn(
                          "w-full border rounded px-2 py-1 text-xs font-mono text-right outline-none focus:border-violet-500",
                          state.isLightMode
                            ? "bg-white border-gray-300 text-violet-700"
                            : "bg-gray-950 border-gray-700 text-violet-300"
                        )}
                        value={state.c2XMax}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) updateState('c2XMax', val);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {state.rotationCenterMode === 'C2' ? (
             <ControlItem 
              label="Vertical (Y)" 
              unit="mm"
              value={state.c2Y}
              min={-1000} 
              max={1000} 
              step={0.1}
              onChange={(v) => updateState('c2Y', v)}
              valueClassName="text-purple-600"
              isLightMode={state.isLightMode}
            />
          ) : (
            <div className={cn("pt-2 border-t", state.isLightMode ? "border-gray-200" : "border-gray-700/50")}>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-gray-400 flex items-center">
                  Crystal Gap (Y)
                  <button 
                    onClick={() => updateState('autoGap', !state.autoGap)}
                    className={cn(
                      "ml-2 text-[10px] px-2 py-0.5 rounded border transition-colors focus:outline-none",
                      state.autoGap 
                        ? "border-blue-500 bg-blue-900/50 text-blue-300" 
                        : (state.isLightMode ? "border-gray-300 bg-gray-100 text-gray-600" : "border-gray-600 bg-gray-800 text-gray-400 hover:text-white")
                    )}
                  >
                    Auto: {state.autoGap ? "ON" : "OFF"}
                  </button>
                </label>
              </div>
              <ControlItem 
                label=""
                unit="mm"
                value={state.c2Y}
                min={-1000} 
                max={1000} 
                step={0.1}
                disabled={state.autoGap}
                onChange={(v) => updateState('c2Y', v)}
                valueClassName="text-purple-600"
                isLightMode={state.isLightMode}
              />
              {state.autoGap && (
                <div className={cn(
                  "p-3 rounded border mt-2",
                  state.isLightMode ? "bg-indigo-50 border-indigo-200" : "bg-indigo-900/20 border-indigo-500/30"
                )}>
                  <ControlItem 
                    label="Fixed Beam Offset h" 
                    unit="mm"
                    value={state.offsetH}
                    min={0} 
                    max={1000} 
                    step={0.1}
                    onChange={(v) => updateState('offsetH', v)}
                    valueClassName="text-indigo-600"
                    isLightMode={state.isLightMode}
                  />
                </div>
              )}
            </div>
          )}

          <ControlItem 
            label="Pitch" 
            unit="µrad"
            value={state.c2Pitch}
            min={-500} 
            max={500} 
            step={1}
            onChange={(v) => updateState('c2Pitch', v)}
            valueClassName="text-purple-600"
            isLightMode={state.isLightMode}
          />
        </ControlSection>

        {/* Flat Mirror / Auto-Collimator */}
        <ControlSection
          title="Flat Mirror (Auto-Collimator)"
          icon={ArrowLeftRight}
          isLightMode={state.isLightMode}
          className={cn(
            "border-orange-500/30",
            state.isLightMode ? "bg-orange-50/50" : "bg-orange-900/10"
          )}
          titleColor="text-orange-500"
          iconColor="text-orange-500"
        >
          <div className="flex justify-between items-center">
            <label className={cn("text-xs", state.isLightMode ? "text-orange-600" : "text-orange-300")}>
              Return-path mirror for double-pass alignment
            </label>
            <button
              onClick={() => updateState('mirrorEnabled', !state.mirrorEnabled)}
              className={cn(
                "px-4 py-1.5 rounded text-xs font-bold transition-all border shrink-0 ml-2",
                state.mirrorEnabled
                  ? "bg-orange-600 border-orange-400 text-white shadow-md"
                  : (state.isLightMode
                      ? "border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200"
                      : "border-gray-600 bg-gray-800 text-gray-400 hover:text-white")
              )}
            >
              {state.mirrorEnabled ? "● ON" : "○ OFF"}
            </button>
          </div>

          {state.mirrorEnabled && (
            <div className="space-y-3 pt-2">
              <ControlItem
                label="Mirror X"
                unit="mm"
                value={state.mirrorX}
                min={100}
                max={5000}
                step={10}
                onChange={(v) => updateState('mirrorX', v)}
                valueClassName="text-orange-500"
                isLightMode={state.isLightMode}
              />
              <ControlItem
                label="Tilt"
                unit="mrad"
                value={state.mirrorAngle}
                min={-100}
                max={100}
                step={0.1}
                onChange={(v) => updateState('mirrorAngle', v)}
                valueClassName="text-orange-500"
                isLightMode={state.isLightMode}
              />
              <ControlItem
                label="Length"
                unit="mm"
                value={state.mirrorLen}
                min={10}
                max={500}
                step={10}
                onChange={(v) => updateState('mirrorLen', v)}
                valueClassName="text-orange-500"
                isLightMode={state.isLightMode}
              />
            </div>
          )}
        </ControlSection>

        {/* Parameter Scan */}
        <ControlSection
          title="Parameter Scan"
          icon={Activity}
          isLightMode={state.isLightMode}
          className={cn(
            "border-emerald-500/30",
            state.isLightMode ? "bg-emerald-50/50" : "bg-emerald-900/10"
          )}
          titleColor="text-emerald-500"
          iconColor="text-emerald-500"
        >
          {/* Scan Type Toggle */}
          <div className="space-y-1">
            <label className={cn("text-[10px] uppercase font-bold", state.isLightMode ? "text-gray-500" : "text-gray-400")}>
              Scan Dimension
            </label>
            <div className={cn(
              "grid grid-cols-2 gap-1 p-1 rounded-md border",
              state.isLightMode ? "bg-white border-gray-200" : "bg-gray-950 border-gray-800"
            )}>
              <button
                onClick={() => updateState({ scanType: 'theta', scanStart: 5.0, scanStop: 15.0, scanCurrentStep: 0 })}
                disabled={state.scanActive}
                className={cn(
                  "py-1 text-xs rounded transition-all font-semibold",
                  state.scanType === 'theta'
                    ? "bg-emerald-600 text-white shadow-sm"
                    : (state.isLightMode ? "text-gray-600 hover:bg-gray-100" : "text-gray-400 hover:text-white")
                )}
              >
                Theta (Deg)
              </button>
              <button
                onClick={() => updateState({ scanType: 'energy', scanStart: 12.0, scanStop: 20.0, scanCurrentStep: 0 })}
                disabled={state.scanActive}
                className={cn(
                  "py-1 text-xs rounded transition-all font-semibold",
                  state.scanType === 'energy'
                    ? "bg-emerald-600 text-white shadow-sm"
                    : (state.isLightMode ? "text-gray-600 hover:bg-gray-100" : "text-gray-400 hover:text-white")
                )}
              >
                Energy (keV)
              </button>
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={cn("text-[10px] uppercase font-bold", state.isLightMode ? "text-gray-500" : "text-gray-400")}>
                Start
              </label>
              <input
                type="number"
                disabled={state.scanActive}
                className={cn(
                  "w-full border rounded px-2 py-1 text-xs font-mono outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto",
                  state.isLightMode ? "bg-white border-gray-200" : "bg-gray-950 border-gray-800"
                )}
                value={state.scanStart}
                onChange={(e) => updateState('scanStart', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <label className={cn("text-[10px] uppercase font-bold", state.isLightMode ? "text-gray-500" : "text-gray-400")}>
                Stop
              </label>
              <input
                type="number"
                disabled={state.scanActive}
                className={cn(
                  "w-full border rounded px-2 py-1 text-xs font-mono outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto",
                  state.isLightMode ? "bg-white border-gray-200" : "bg-gray-950 border-gray-800"
                )}
                value={state.scanStop}
                onChange={(e) => updateState('scanStop', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* Jump to Start / Stop buttons */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => {
                if (state.scanType === 'theta') {
                  updateState('rectRotation', state.scanStart);
                } else {
                  handleEnergyChange(state.scanStart);
                }
              }}
              className={cn(
                "py-1 px-2 rounded border text-[10px] font-bold cursor-pointer transition-all text-center",
                state.isLightMode
                  ? "bg-gray-100 hover:bg-gray-250 border-gray-300 text-gray-700"
                  : "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300"
              )}
            >
              Jump to Start
            </button>
            <button
              onClick={() => {
                if (state.scanType === 'theta') {
                  updateState('rectRotation', state.scanStop);
                } else {
                  handleEnergyChange(state.scanStop);
                }
              }}
              className={cn(
                "py-1 px-2 rounded border text-[10px] font-bold cursor-pointer transition-all text-center",
                state.isLightMode
                  ? "bg-gray-100 hover:bg-gray-250 border-gray-300 text-gray-700"
                  : "bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300"
              )}
            >
              Jump to Stop
            </button>
          </div>

          {/* Configuration */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={cn("text-[10px] uppercase font-bold", state.isLightMode ? "text-gray-500" : "text-gray-400")}>
                  Steps
                </label>
                <input
                  type="number"
                  disabled={state.scanActive}
                  className={cn(
                    "w-full border rounded px-2 py-1 text-xs font-mono outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto",
                    state.isLightMode ? "bg-white border-gray-200" : "bg-gray-950 border-gray-800"
                  )}
                  value={state.scanSteps}
                  onChange={(e) => updateState('scanSteps', Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div className="space-y-1">
                <label className={cn("text-[10px] uppercase font-bold", state.isLightMode ? "text-gray-500" : "text-gray-400")}>
                  Motion Time (ms)
                </label>
                <input
                  type="number"
                  disabled={state.scanActive}
                  className={cn(
                    "w-full border rounded px-2 py-1 text-xs font-mono outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto",
                    state.isLightMode ? "bg-white border-gray-200" : "bg-gray-950 border-gray-800"
                  )}
                  value={motionTimeLocal}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMotionTimeLocal(val);
                    const parsed = parseInt(val, 10);
                    if (!isNaN(parsed)) {
                      updateState('scanMotionTime', Math.max(10, parsed));
                    }
                  }}
                  onBlur={() => {
                    setMotionTimeLocal(state.scanMotionTime.toString());
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-1">
              <label className={cn("text-[10px] uppercase font-bold", state.isLightMode ? "text-gray-500" : "text-gray-400")}>
                Dwell Time / Data Acquire (ms)
              </label>
              <input
                type="number"
                disabled={state.scanActive}
                className={cn(
                  "w-full border rounded px-2 py-1 text-xs font-mono outline-none focus:border-emerald-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto",
                  state.isLightMode ? "bg-white border-gray-200" : "bg-gray-950 border-gray-800"
                )}
                value={dwellTimeLocal}
                onChange={(e) => {
                  const val = e.target.value;
                  setDwellTimeLocal(val);
                  const parsed = parseInt(val, 10);
                  if (!isNaN(parsed)) {
                    updateState('scanDwellTime', Math.max(0, parsed));
                  }
                }}
                onBlur={() => {
                  setDwellTimeLocal(state.scanDwellTime.toString());
                }}
              />
            </div>
          </div>

          {/* Execution Controls */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => updateState('scanActive', !state.scanActive)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded text-xs font-bold transition-all border cursor-pointer",
                state.scanActive
                  ? "bg-amber-600 border-amber-400 text-white hover:bg-amber-500 shadow-md"
                  : "bg-emerald-600 border-emerald-400 text-white hover:bg-emerald-500 shadow-md"
              )}
            >
              {state.scanActive ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Start Scan
                </>
              )}
            </button>

            <button
              onClick={() => updateState({ scanActive: false, scanCurrentStep: 0, scanLiveProgress: 0.0, scanPhase: 'idle' })}
              className={cn(
                "px-3 py-2 rounded border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                state.isLightMode
                  ? "border-gray-300 bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "border-gray-600 bg-gray-800 text-gray-300 hover:text-white"
              )}
            >
              <Square className="w-3.5 h-3.5" /> Reset
            </button>
          </div>

          {/* Realistic Phase Status Badge */}
          {state.scanLiveProgress > 0 && (
            <div className={cn(
              "h-8.5 px-2.5 border flex items-center justify-between text-xs font-semibold rounded-lg whitespace-nowrap overflow-hidden shrink-0",
              state.scanPhase === 'moving'
                ? (state.isLightMode ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-amber-950/20 border-amber-900/30 text-amber-400")
                : state.scanPhase === 'dwelling'
                  ? (state.isLightMode ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-emerald-950/20 border-emerald-900/30 text-emerald-400")
                  : (state.isLightMode ? "bg-gray-100 border-gray-200 text-gray-700" : "bg-zinc-800 border-zinc-700 text-zinc-300")
            )}>
              <span className="text-[9.5px] uppercase text-gray-500">Scan Status</span>
              <span className="flex items-center gap-1.5 text-[10.5px]">
                {state.scanPhase === 'moving' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Moving to Step {state.scanCurrentStep + 1}</span>
                  </>
                ) : state.scanPhase === 'dwelling' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Dwelling / Acquiring</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-gray-500" />
                    <span>Scan Completed</span>
                  </>
                )}
              </span>
            </div>
          )}

          {/* Progress Bar / Readout */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[10px] font-semibold text-gray-500">
              <span>Progress</span>
              <span>{state.scanCurrentStep} / {state.scanSteps} steps</span>
            </div>
            <div className={cn(
              "w-full h-2 rounded overflow-hidden relative",
              state.isLightMode ? "bg-gray-200" : "bg-gray-800"
            )}>
              <div
                className="h-full bg-emerald-500 transition-all duration-75"
                style={{ width: `${(state.scanLiveProgress / state.scanSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Trajectory plot view button */}
          <button
            onClick={() => updateState({ showTrajectoryPanel: true, trajectoryPanelHeight: Math.round(window.innerHeight / 3) })}
            className={cn(
              "w-full py-1.5 rounded border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-3",
              state.isLightMode
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border-emerald-750/50 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/25"
            )}
          >
            <Activity className="w-3.5 h-3.5 animate-pulse" /> View Trajectory Plots
          </button>
        </ControlSection>

        <section className={cn("space-y-4 pt-4 border-t", state.isLightMode ? "border-gray-200" : "border-gray-800")}>
          <div className="text-[10px] text-gray-500 italic flex items-center">
            <Info className="w-3 h-3 mr-1" /> Use Mouse Wheel to Zoom, Drag to Pan.
          </div>
        </section>
      </div>
    </div>
  );
};

export default Sidebar;
