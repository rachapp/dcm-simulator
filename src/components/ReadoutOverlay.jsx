import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ReadoutOverlay = ({ state, updateState, readout }) => {
  const [det1Local, setDet1Local] = React.useState(state.det1X);
  const [det2Local, setDet2Local] = React.useState(state.det2X);

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

  return (
    <div className={cn(
      "absolute top-6 right-6 border shadow-lg rounded-lg p-4 backdrop-blur-sm w-72 flex flex-col gap-4 z-10 pointer-events-auto transition-colors duration-300",
      state.isLightMode ? "bg-white/90 border-gray-200" : "bg-gray-900/90 border-gray-700"
    )}>
      {/* Screen 1 (Input) */}
      <div className={cn("border-b pb-3", state.isLightMode ? "border-gray-100" : "border-gray-700/50")}>
        <div className="flex justify-between items-center mb-1">
          <div className="text-xs text-blue-500 uppercase tracking-wider font-semibold">Screen 1 (upstream) y</div>
          <input 
            type="number" 
            step="any"
            className={cn(
              "border rounded px-2 py-0.5 text-xs text-right w-16 font-mono text-blue-500 outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto",
              state.isLightMode ? "bg-white border-gray-200" : "bg-gray-950 border-gray-700"
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
        <div className={cn(
          "font-mono font-bold text-sm",
          readout.yHit1 !== null ? "text-blue-500" : "text-gray-400"
        )}>
          {readout.yHit1 !== null ? `Position = ${readout.yHit1.toFixed(3)} mm` : "No Hit"}
        </div>
      </div>
      
      {/* Screen 2 (Output) */}
      <div className={cn("border-b pb-3", state.isLightMode ? "border-gray-100" : "border-gray-700/50")}>
        <div className="flex justify-between items-center mb-1">
          <div className="text-xs text-yellow-600 uppercase tracking-wider font-semibold">Screen 2 (downstream) y</div>
          <input 
            type="number" 
            step="any"
            className={cn(
              "border rounded px-2 py-0.5 text-xs text-right w-16 font-mono text-yellow-600 outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto",
              state.isLightMode ? "bg-white border-gray-200" : "bg-gray-950 border-gray-700"
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
        <div className={cn(
          "font-mono font-bold text-sm",
          readout.yHit2 !== null ? "text-yellow-600" : "text-gray-400"
        )}>
          {readout.yHit2 !== null ? `Position = ${readout.yHit2.toFixed(3)} mm` : "No Hit"}
        </div>
      </div>


      {/* True Offset */}
      <div>
        <div className="text-xs text-green-600 uppercase tracking-wider font-semibold mb-1">Beam Offset (S2 - S1)</div>
        <div className={cn(
          "font-mono font-bold text-lg",
          readout.trueOffset !== null ? "text-green-600" : "text-gray-400"
        )}>
          {readout.trueOffset !== null ? `${readout.trueOffset.toFixed(3)} mm` : "--"}
        </div>
      </div>
    </div>
  );
};

export default ReadoutOverlay;
