import React from 'react';
import { Settings, Zap, RotateCw, Move, Maximize, Layers, Sliders, Info } from 'lucide-react';
import ControlSection from './ControlSection';
import ControlItem from './ControlItem';
import { PRESETS } from '../engine';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Sidebar = ({ state, setState, updateState, energy, handleEnergyChange, physics, snapToPivot }) => {
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
            label="Thickness" 
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
            label="Local C1 X" 
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
              label="Local C1 Y" 
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
                  Vertical Gap Y (mm)
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
                value={state.c1Y}
                min={-1000} 
                max={1000} 
                step={0.1}
                disabled={state.autoGap}
                onChange={(v) => updateState('c1Y', v)}
                valueClassName="text-purple-600"
                isLightMode={state.isLightMode}
              />
              {state.autoGap && (
                <div className={cn(
                  "p-3 rounded border mt-2",
                  state.isLightMode ? "bg-indigo-50 border-indigo-200" : "bg-indigo-900/20 border-indigo-500/30"
                )}>
                  <ControlItem 
                    label="Fixed Offset h" 
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
          <ControlItem 
            label="Horizontal Shift X" 
            unit="mm"
            value={state.c2X}
            min={-1000} 
            max={1000} 
            step={0.1}
            onChange={(v) => updateState('c2X', v)}
            valueClassName="text-purple-600"
            isLightMode={state.isLightMode}
          />

          {state.rotationCenterMode === 'C2' ? (
             <ControlItem 
              label="Local C2 Y" 
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
                  Vertical Gap Y (mm)
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
                    label="Fixed Offset h" 
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
            label="Pitch Detune" 
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
