import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HC, PRESETS, RectangleItem, Ray } from './engine';
import Sidebar from './components/Sidebar';
import SimulatorCanvas from './components/SimulatorCanvas';
import ReadoutOverlay from './components/ReadoutOverlay';
import FootprintOverlay from './components/FootprintOverlay';
import { cn } from './utils';

const App = () => {
  const [state, setState] = useState({
    dSpacing: PRESETS['Si111'],
    beamSize: 2.0,
    divergence: 0.0,
    numRays: 3,
    startX: -1000,
    startY: 0,
    rayAngle: 0,
    rectRotation: 5.0,
    rayAngleOffset: 0.0,
    autoRayOffset: true,
    globalX: 0.0,
    globalY: 0.0,
    globalPitch: 0.0,
    c1Len: 40,
    c2Len: 130,
    thickness: 20,
    c1X: 0,
    c1Y: 0,
    c2X: 0,
    c2Y: 10,
    c2Pitch: 0.0,
    autoGap: true,
    offsetH: 20.0,
    autoC2X: true,
    c2XMin: 65.0,
    c2XMax: 935.0,
    det1X: -500.0,
    det2X: 1000.0,
    zoom: 1.0,
    showGrid: false,
    showAxes: true,
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

  // FIX P1: when the crystal type (dSpacing) changes, recalculate the
  // Bragg angle so the energy readout stays in sync with the new lattice.
  useEffect(() => {
    if (energy <= 0) return;
    const minAllowedEnergy = HC / (2 * state.dSpacing);
    const energyVal = Math.max(energy, minAllowedEnergy);
    const lambda = HC / energyVal;
    const sinTheta = lambda / (2 * state.dSpacing);
    if (sinTheta <= 1) {
      const thetaRad = Math.asin(sinTheta);
      const trueBraggDeg = thetaRad * 180 / Math.PI;
      const rayAngleOffsetDeg = (state.rayAngleOffset / 1000) * (180 / Math.PI);
      const globalPitchDeg   = (state.globalPitch   / 1000) * (180 / Math.PI);
      setState(prev => ({
        ...prev,
        rectRotation: trueBraggDeg + rayAngleOffsetDeg - globalPitchDeg
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.dSpacing]);

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
          globalY: 0.0,          // C1 pivot → beam axis at y = 0
          c1X: 0.0,
          c1Y: 0.0,
          c2Y: 10.0
        };
      } else {
        // C2 pivot → global origin moves to C2 surface height
        // The beam output is at h above the input; C2 sits at h/2 above the
        // midpoint, so globalY = offsetH / 2 keeps the geometry consistent.
        return {
          ...prev,
          rotationCenterMode: 'C2',
          globalY: prev.offsetH / 2,  // C2 pivot → beam axis at y = offsetH/2
          c1X: 0.0,
          c2X: 0.0,
          c2Y: 0.0,
          c1Y: -10.0
        };
      }
    });
  }, []);
  // Auto Gap effect
  // FIX B4: compute all derived values inside the setState updater so we
  // always read from the latest prev state rather than a stale closure.
  useEffect(() => {
    if (!state.autoGap) return;

    setState(prev => {
      if (!prev.autoGap) return prev;

      const rayAngleOffsetDeg = (prev.rayAngleOffset / 1000) * (180 / Math.PI);
      const globalPitchDeg    = (prev.globalPitch    / 1000) * (180 / Math.PI);
      const trueBraggDeg = prev.rectRotation + globalPitchDeg - rayAngleOffsetDeg;
      const thetaRad  = trueBraggDeg * Math.PI / 180;
      const cosTheta  = Math.cos(thetaRad);

      if (Math.abs(cosTheta) <= 0.001) return prev;

      const g = prev.offsetH / (2 * cosTheta);
      const isC1Pivot = prev.rotationCenterMode === 'C1';

      if (isC1Pivot) {
        // C1 is fixed — move C2
        const targetC2Y = prev.c1Y + g;
        if (Math.abs(prev.c2Y - targetC2Y) > 0.001) {
          return { ...prev, c2Y: targetC2Y };
        }
      } else {
        // C2 is fixed — move C1
        const targetC1Y = prev.c2Y - g;
        if (Math.abs(prev.c1Y - targetC1Y) > 0.001) {
          return { ...prev, c1Y: targetC1Y };
        }
      }
      return prev;
    });
  }, [state.autoGap, state.rectRotation, state.globalPitch, state.rayAngleOffset, state.offsetH, state.rotationCenterMode]);

  // Auto C2X: positions C2 so the reflected beam from C1 hits C2's surface.
  //
  // Geometry derivation:
  //  A horizontal beam at y≈0 hits C1's tilted surface (tilt angle θ) at:
  //    P₁ = (−c1Y / sinθ, 0)  [lab frame]
  //  The reflected ray travels at 2θ above horizontal from P₁.
  //  C2's bottom-surface centre (pre-rotation at y=c2Y, x=c2X) rotates to:
  //    x_lab = c2X·cosθ − c2Y·sinθ
  //  Solving "reflected ray from P₁ passes through C2's centre" gives:
  //    c2X = (c2Y − 2·c1Y) / tan(θ)
  //  (simplifies to c2Y/tanθ for the default case c1Y=0)
  //
  // The result is clamped to the physical stage limits [c2XMin, c2XMax].
  useEffect(() => {
    if (!state.autoC2X) return;

    setState(prev => {
      if (!prev.autoC2X) return prev;

      const rayAngleOffsetDeg = (prev.rayAngleOffset / 1000) * (180 / Math.PI);
      const globalPitchDeg    = (prev.globalPitch    / 1000) * (180 / Math.PI);
      const trueBraggDeg = prev.rectRotation + globalPitchDeg - rayAngleOffsetDeg;
      const thetaRad     = trueBraggDeg * Math.PI / 180;
      const tanTheta     = Math.tan(thetaRad);

      // Guard against θ ≈ 0 (tan(0) = 0 → divide-by-zero)
      if (Math.abs(tanTheta) < 0.001) return prev;

      // Position C2 so the reflected beam from C1 lands on C2's centre
      // Corrected with globalY pivot offset: (c2Y - 2*c1Y)/tanθ - globalY/sinθ
      const rawC2X  = (prev.c2Y - 2 * prev.c1Y) / tanTheta - prev.globalY / Math.sin(thetaRad);

      // Clamp to physical stage travel range
      const clamped = Math.max(prev.c2XMin, Math.min(prev.c2XMax, rawC2X));

      if (Math.abs(prev.c2X - clamped) > 0.0001) {
        return { ...prev, c2X: clamped };
      }
      return prev;
    });
  }, [state.autoC2X, state.rectRotation, state.globalPitch, state.rayAngleOffset, state.c2Y, state.c1Y, state.c2XMin, state.c2XMax, state.globalY]);


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

    // FIX B1: centre c2 horizontally around the pivot (mirrors c1 geometry)
    const c2 = new RectangleItem(
      state.c2X - state.c2Len / 2 + state.globalX,
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
    // FIX B2: state.divergence is in µrad; Ray constructor expects mrad.
    // Convert µrad → mrad here so the scale is consistent.
    const divMrad = state.divergence / 1000; // µrad ÷ 1000 = mrad
    let offsets = [];
    let angleOffsets = [];

    if (n === 1) {
      offsets = [0];
      angleOffsets = [0];
    } else {
      for (let i = 0; i < n; i++) {
        offsets.push(-s / 2 + i * (s / (n - 1)));
        // angleOffsets in mrad — Ray constructor divides by 1000 → radians
        angleOffsets.push(-divMrad / 2 + i * (divMrad / (n - 1)));
      }
    }

    const rayColor = state.isLightMode ? '#2563eb' : '#00ffff';

    return offsets.map((off, i) => {
      const ray = new Ray([state.startX, state.startY + off], state.rayAngle + angleOffsets[i], rayColor);
      ray.cast(crystals);
      return ray;
    });
  }, [state.beamSize, state.numRays, state.divergence, state.startX, state.startY, state.rayAngle, crystals, state.isLightMode]);

  const readout = useMemo(() => {
    const centralRay = new Ray([state.startX, state.startY], state.rayAngle);
    centralRay.cast(crystals);
    const yHit1 = centralRay.detectAtX(state.det1X);
    const yHit2 = centralRay.detectAtX(state.det2X);
    const trueOffset = (yHit1 !== null && yHit2 !== null) ? yHit2 - yHit1 : null;
    return { yHit1, yHit2, trueOffset, pivotMarkerPos, centralRay };
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
        <FootprintOverlay 
          state={state}
          updateState={updateState}
          readout={readout}
        />
      </div>
    </div>
  );
};

export default App;
