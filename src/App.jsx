import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { HC, PRESETS, RectangleItem, Ray } from './engine';
import Sidebar from './components/Sidebar';
import SimulatorCanvas from './components/SimulatorCanvas';
import ReadoutOverlay from './components/ReadoutOverlay';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const App = () => {
  const [state, setState] = useState({
    dSpacing: PRESETS['Si111'],
    beamSize: 3.0,
    divergence: 0.0,
    numRays: 3,
    startX: -1000,
    startY: 0,
    rayAngle: 0,
    rectRotation: 10.0,
    rayAngleOffset: 0.0,
    autoRayOffset: true,
    globalX: 0.0,
    globalY: 0.0,
    globalPitch: 0.0,
    c1Len: 40,
    c2Len: 120,
    thickness: 20,
    c1X: 0,
    c1Y: 0,
    c2X: 0,
    c2Y: 10,
    c2Pitch: 0.0,
    autoGap: false,
    offsetH: 20.0,
    det1X: -150.0,
    det2X: 150.0,
    zoom: 1.0,
    showGrid: false,
    viewCenterX: 50,
    viewCenterY: 0,
    isLightMode: false,
    uiVisible: true,
    crystalType: 'Si111',
    rotationCenterMode: 'C1'
  });

  const [energy, setEnergy] = useState(0);

  // Physics Calculations
  const physics = useMemo(() => {
    const rayAngleOffsetDeg = (state.rayAngleOffset / 1000) * (180 / Math.PI);
    const globalPitchDeg = (state.globalPitch / 1000) * (180 / Math.PI);
    const trueBraggDeg = state.rectRotation + globalPitchDeg - rayAngleOffsetDeg;
    const thetaRad = trueBraggDeg * Math.PI / 180;
    const lambda = 2 * state.dSpacing * Math.sin(thetaRad);
    
    let calcEnergy = 0;
    if (thetaRad > 0 && lambda > 0) {
      calcEnergy = HC / lambda;
    }

    return { trueBraggDeg, lambda, energy: calcEnergy };
  }, [state.rectRotation, state.globalPitch, state.rayAngleOffset, state.dSpacing]);

  // Update energy state
  useEffect(() => {
    if (physics.energy > 0) {
      setEnergy(physics.energy);
    }
  }, [physics.energy]);

  const handleEnergyChange = (newEnergy) => {
    if (newEnergy <= 0) return;
    const minAllowedEnergy = HC / (2 * state.dSpacing);
    const energyVal = Math.max(newEnergy, minAllowedEnergy);
    setEnergy(energyVal);

    const lambda = HC / energyVal;
    const sinTheta = lambda / (2 * state.dSpacing);
    if (sinTheta <= 1) {
      const thetaRad = Math.asin(sinTheta);
      const trueBraggDeg = thetaRad * 180 / Math.PI;
      const rayAngleOffsetDeg = (state.rayAngleOffset / 1000) * (180 / Math.PI);
      const globalPitchDeg = (state.globalPitch / 1000) * (180 / Math.PI);
      
      setState(prev => ({
        ...prev,
        rectRotation: trueBraggDeg + rayAngleOffsetDeg - globalPitchDeg
      }));
    }
  };

  // Auto Ray Offset
  useEffect(() => {
    if (state.autoRayOffset) {
      setState(prev => {
        if (prev.rayAngleOffset !== prev.rayAngle) {
          return { ...prev, rayAngleOffset: prev.rayAngle };
        }
        return prev;
      });
    }
  }, [state.autoRayOffset, state.rayAngle]);

  // Handle Rotation Center Snapping
  const snapToPivot = useCallback((mode) => {
    setState(prev => {
      if (mode === 'C1') {
        return {
          ...prev,
          rotationCenterMode: 'C1',
          c1X: 0.0,
          c1Y: 0.0,
          c2Y: 10.0
        };
      } else {
        // Switch to C2 pivot
        return {
          ...prev,
          rotationCenterMode: 'C2',
          c1X: 0.0,
          c2X: 0.0,
          c2Y: 0.0,
          c1Y: -10.0
        };
      }
    });
  }, []);
// Auto Gap effect
useEffect(() => {
  if (state.autoGap) {
    const rayAngleOffsetDeg = (state.rayAngleOffset / 1000) * (180 / Math.PI);
    const globalPitchDeg = (state.globalPitch / 1000) * (180 / Math.PI);
    const trueBraggDeg = state.rectRotation + globalPitchDeg - rayAngleOffsetDeg;
    const thetaRad = trueBraggDeg * Math.PI / 180;
    const cosTheta = Math.cos(thetaRad);

    if (Math.abs(cosTheta) > 0.001) {
      const g = state.offsetH / (2 * cosTheta);
      const isC1Pivot = state.rotationCenterMode === 'C1';

      setState(prev => {
        if (isC1Pivot) {
          // C1 is fixed, move C2
          const targetC2Y = prev.c1Y + g;
          if (Math.abs(prev.c2Y - targetC2Y) > 0.001) {
            return { ...prev, c2Y: targetC2Y };
          }
        } else {
          // C2 is fixed, move C1
          const targetC1Y = prev.c2Y - g;
          if (Math.abs(prev.c1Y - targetC1Y) > 0.001) {
            return { ...prev, c1Y: targetC1Y };
          }
        }
        return prev;
      });
    }
  }
}, [state.autoGap, state.rectRotation, state.globalPitch, state.rayAngleOffset, state.offsetH, state.rotationCenterMode]);


  const updateState = useCallback((keyOrObject, value) => {
    setState(prev => {
      if (typeof keyOrObject === 'object') {
        return { ...prev, ...keyOrObject };
      } else {
        return { ...prev, [keyOrObject]: value };
      }
    });
  }, []);

  // Rendering data preparation
  const crystals = useMemo(() => {
    const axis = [state.globalX, state.globalY];

    const c1 = new RectangleItem(
      state.c1X - state.c1Len / 2 + state.globalX,
      state.c1Y - state.thickness + state.globalY,
      state.c1Len,
      state.thickness,
      0,
      '#e5e7eb',
      axis
    );

    const c2 = new RectangleItem(
      state.c2X + state.globalX,
      state.c2Y + state.globalY,
      state.c2Len,
      state.thickness,
      0,
      '#e5e7eb',
      axis
    );

    const globalPitchDeg = (state.globalPitch / 1000) * (180 / Math.PI);
    c1.applyGlobalRotation(state.rectRotation + globalPitchDeg);
    c2.applyGlobalRotation(state.rectRotation + globalPitchDeg + (state.c2Pitch / 1000000) * (180 / Math.PI));

    return [c1, c2];
  }, [state.c1X, state.c1Len, state.thickness, state.globalX, state.c1Y, state.globalY, state.c2X, state.c2Y, state.c2Len, state.globalPitch, state.rectRotation, state.c2Pitch]);

  const pivotMarkerPos = useMemo(() => [state.globalX, state.globalY], [state.globalX, state.globalY]);

  const rays = useMemo(() => {
    const s = state.beamSize;
    const n = Math.max(1, Math.round(state.numRays));
    const divMrad = state.divergence / 1000;
    let offsets = [];
    let angleOffsets = [];
    
    if (n === 1) {
        offsets = [0];
        angleOffsets = [0];
    } else {
        for (let i = 0; i < n; i++) {
            offsets.push(-s/2 + i * (s / (n - 1)));
            angleOffsets.push(-divMrad/2 + i * (divMrad / (n - 1)));
        }
    }
    
    return offsets.map((off, i) => {
        const ray = new Ray([state.startX, state.startY + off], state.rayAngle + angleOffsets[i]);
        ray.cast(crystals);
        return ray;
    });
  }, [state.beamSize, state.numRays, state.divergence, state.startX, state.startY, state.rayAngle, crystals]);

  const readout = useMemo(() => {
    const centralRay = new Ray([state.startX, state.startY], state.rayAngle);
    centralRay.cast(crystals);
    const yHit1 = centralRay.detectAtX(state.det1X);
    const yHit2 = centralRay.detectAtX(state.det2X);
    const trueOffset = (yHit1 !== null && yHit2 !== null) ? yHit2 - yHit1 : null;
    return { yHit1, yHit2, trueOffset, pivotMarkerPos };
  }, [state.startX, state.startY, state.rayAngle, crystals, state.det1X, state.det2X, pivotMarkerPos]);

  return (
    <div className={cn(
      "flex h-screen overflow-hidden font-sans transition-colors duration-300", 
      state.isLightMode ? "bg-gray-50 text-gray-900" : "bg-gray-950 text-gray-200"
    )}>
      <Sidebar 
        state={state} 
        setState={setState} 
        updateState={updateState} 
        energy={energy}
        handleEnergyChange={handleEnergyChange}
        physics={physics}
        snapToPivot={snapToPivot}
      />
      
      <div className="flex-1 relative flex flex-col">
        <SimulatorCanvas 
          state={state}
          updateState={updateState}
          crystals={crystals}
          rays={rays}
          readout={readout}
        />
        <ReadoutOverlay 
          state={state}
          updateState={updateState}
          readout={readout}
        />
      </div>
    </div>
  );
};

export default App;
