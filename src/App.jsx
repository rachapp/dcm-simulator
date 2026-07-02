import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HC, PRESETS, RectangleItem, Ray } from './engine';
import Sidebar from './components/Sidebar';
import SimulatorCanvas from './components/SimulatorCanvas';
import ReadoutOverlay from './components/ReadoutOverlay';
import FootprintOverlay from './components/FootprintOverlay';
import TrajectoryPanel from './components/TrajectoryPanel';
import { cn } from './utils';

const syncAutoCalculations = (next) => {
  // 1. Auto Ray Offset
  if (next.autoRayOffset) {
    next.rayAngleOffset = next.rayAngle;
  }

  // 2. Auto Gap
  if (next.autoGap) {
    const rayAngleOffsetDeg = (next.rayAngleOffset / 1000) * (180 / Math.PI);
    const globalPitchDeg    = (next.globalPitch    / 1000) * (180 / Math.PI);
    const trueBraggDeg = next.rectRotation + globalPitchDeg - rayAngleOffsetDeg;
    const thetaRad  = trueBraggDeg * Math.PI / 180;
    const cosTheta  = Math.cos(thetaRad);

    if (Math.abs(cosTheta) > 0.001) {
      const g = next.offsetH / (2 * cosTheta);
      const isC1Pivot = next.rotationCenterMode === 'C1';
      if (isC1Pivot) {
        next.c2Y = next.c1Y + g;
      } else {
        next.c1Y = next.c2Y - g;
      }
    }
  }

  // 3. Auto C2X
  if (next.autoC2X) {
    const rayAngleOffsetDeg = (next.rayAngleOffset / 1000) * (180 / Math.PI);
    const globalPitchDeg    = (next.globalPitch    / 1000) * (180 / Math.PI);
    const trueBraggDeg = next.rectRotation + globalPitchDeg - rayAngleOffsetDeg;
    const thetaRad     = trueBraggDeg * Math.PI / 180;
    const tanTheta     = Math.tan(thetaRad);

    if (Math.abs(tanTheta) >= 0.001) {
      const rawC2X  = (next.c2Y - 2 * next.c1Y) / tanTheta - next.globalY / Math.sin(thetaRad);
      next.c2X = Math.max(next.c2XMin, Math.min(next.c2XMax, rawC2X));
    }
  }

  return next;
};

const App = () => {
  const [state, setState] = useState(() => {
    const defaultVal = {
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
      thickness: 15,
      c1X: 0,
      c1Y: 0,
      c2X: 65,
      c2Y: 10,
      c2Pitch: 0.0,
      autoGap: true,
      offsetH: 20.0,
      autoC2X: false,
      c2XMin: 65.0,
      c2XMax: 935.0,
      det1X: -50.0,
      det2X: 150.0,
      zoom: 1.0,
      showGrid: false,
      showAxes: true,
      viewCenterX: 50,
      viewCenterY: 0,
      isLightMode: false,
      uiVisible: true,
      crystalType: 'Si111',
      rotationCenterMode: 'C1',
      // Flat Mirror (Auto-Collimator)
      mirrorEnabled: false,
      mirrorX: 1500,
      mirrorAngle: 0.0,   // mrad, tilt from vertical
      mirrorLen: 200,      // mm

      // Parameter Scan
      scanType: 'theta',   // 'theta' | 'energy'
      scanStart: 5.0,      // degrees (for theta) or keV (for energy)
      scanStop: 15.0,
      scanSteps: 50,
      scanMotionTime: 500, // travel time between steps (ms)
      scanDwellTime: 300,  // measurement dwell time at each step (ms)
      scanActive: false,
      scanCurrentStep: 0,
      scanLiveProgress: 0.0, // continuous float step index (0.0 to scanSteps)
      scanPhase: 'idle',   // 'idle' | 'moving' | 'dwelling'
      showTrajectoryPanel: false,
      trajectoryPanelHeight: Math.round(window.innerHeight / 3),
      trajectoryPanelMinimized: false
    };
    return syncAutoCalculations(defaultVal);
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

      setState(prev => {
        const next = {
          ...prev,
          rectRotation: trueBraggDeg + rayAngleOffsetDeg - globalPitchDeg
        };
        return syncAutoCalculations(next);
      });
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
      setState(prev => {
        const next = {
          ...prev,
          rectRotation: trueBraggDeg + rayAngleOffsetDeg - globalPitchDeg
        };
        return syncAutoCalculations(next);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.dSpacing]);

  // Handle Rotation Center Snapping
  const snapToPivot = useCallback((mode) => {
    setState(prev => {
      let next;
      if (mode === 'C1') {
        next = {
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
        next = {
          ...prev,
          rotationCenterMode: 'C2',
          globalY: prev.offsetH / 2,  // C2 pivot → beam axis at y = offsetH/2
          c1X: 0.0,
          c2X: 65.0,
          c2Y: 0.0,
          c1Y: -10.0
        };
      }
      return syncAutoCalculations(next);
    });
  }, [syncAutoCalculations]);

  const updateState = useCallback((keyOrObject, value) => {
    setState(prev => {
      let next = typeof keyOrObject === 'object'
        ? { ...prev, ...keyOrObject }
        : { ...prev, [keyOrObject]: value };
      return syncAutoCalculations(next);
    });
  }, [syncAutoCalculations]);

  // Parameter Scan Runner Hook (Realistic: Motion & Dwell Phases)
  useEffect(() => {
    if (!state.scanActive) return;

    let animFrameId;
    let startTime = null;
    
    // Capture the starting step. If resuming, start from scanLiveProgress.
    // Otherwise, start from 0.0.
    const startProgress = state.scanLiveProgress >= state.scanSteps ? 0.0 : state.scanLiveProgress;
    const totalStepTime = state.scanMotionTime + state.scanDwellTime;

    const loop = (timestamp) => {
      if (!startTime) {
        startTime = timestamp - (startProgress * totalStepTime);
      }

      const elapsed = timestamp - startTime;
      const progressFloat = elapsed / totalStepTime;

      if (progressFloat >= state.scanSteps) {
        // Scan completed
        setState(prev => {
          const finalVal = prev.scanStop;
          let next = {
            ...prev,
            scanActive: false,
            scanCurrentStep: prev.scanSteps,
            scanLiveProgress: prev.scanSteps,
            scanPhase: 'idle'
          };
          if (prev.scanType === 'theta') {
            next.rectRotation = finalVal;
          } else {
            const lambda = HC / finalVal;
            const sinTheta = lambda / (2 * prev.dSpacing);
            if (sinTheta <= 1) {
              const thetaRad = Math.asin(sinTheta);
              const trueBraggDeg = thetaRad * 180 / Math.PI;
              const rayAngleOffsetDeg = (prev.rayAngleOffset / 1000) * (180 / Math.PI);
              const globalPitchDeg = (prev.globalPitch / 1000) * (180 / Math.PI);
              next.rectRotation = trueBraggDeg + rayAngleOffsetDeg - globalPitchDeg;
            }
          }
          return syncAutoCalculations(next);
        });
        return;
      }

      // Calculate current step index and within-step phase
      const stepIndex = Math.floor(progressFloat);
      const stepElapsed = elapsed % totalStepTime;

      const isMoving = stepElapsed < state.scanMotionTime;
      const phase = isMoving ? 'moving' : 'dwelling';

      // Interpolation factor: 
      // If moving, interpolate from stepIndex to stepIndex + 1.
      // If dwelling, stay exactly at stepIndex + 1.
      const motionProgress = isMoving ? (stepElapsed / state.scanMotionTime) : 1.0;
      const activeStepVal = stepIndex + motionProgress;

      const startVal = state.scanStart;
      const stopVal = state.scanStop;
      const steps = state.scanSteps;
      const currentVal = startVal + (activeStepVal / steps) * (stopVal - startVal);

      setState(prev => {
        // Double check in case scan was deactivated concurrently
        if (!prev.scanActive) return prev;

        let next = {
          ...prev,
          scanCurrentStep: stepIndex + (isMoving ? 0 : 1),
          scanLiveProgress: activeStepVal,
          scanPhase: phase
        };

        if (prev.scanType === 'theta') {
          next.rectRotation = currentVal;
        } else {
          const lambda = HC / currentVal;
          const sinTheta = lambda / (2 * prev.dSpacing);
          if (sinTheta <= 1) {
            const thetaRad = Math.asin(sinTheta);
            const trueBraggDeg = thetaRad * 180 / Math.PI;
            const rayAngleOffsetDeg = (prev.rayAngleOffset / 1000) * (180 / Math.PI);
            const globalPitchDeg = (prev.globalPitch / 1000) * (180 / Math.PI);
            next.rectRotation = trueBraggDeg + rayAngleOffsetDeg - globalPitchDeg;
          }
        }

        return syncAutoCalculations(next);
      });

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animFrameId);
  }, [
    state.scanActive,
    state.scanMotionTime,
    state.scanDwellTime,
    state.scanSteps,
    state.scanStart,
    state.scanStop,
    syncAutoCalculations
  ]);

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

  // Flat mirror for the auto-collimator double-pass setup.
  // A thin vertical rectangle at mirrorX, tilted by mirrorAngle (mrad from vertical).
  const mirror = useMemo(() => {
    if (!state.mirrorEnabled) return null;
    const angleDeg = (state.mirrorAngle / 1000) * (180 / Math.PI);
    const m = new RectangleItem(
      state.mirrorX - 1,          // left edge (2 mm wide)
      -state.mirrorLen / 2,       // centred on beam axis
      2,
      state.mirrorLen,
      0,
      '#f97316',
      [state.mirrorX, 0]          // rotate about beam-axis height
    );
    m.applyGlobalRotation(angleDeg);
    return m;
  }, [state.mirrorEnabled, state.mirrorX, state.mirrorAngle, state.mirrorLen]);

  // Combined scene: DCM crystals + optional flat mirror.
  const scene = useMemo(
    () => (mirror ? [...crystals, mirror] : crystals),
    [crystals, mirror]
  );

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
      ray.cast(scene);
      return ray;
    });
  }, [state.beamSize, state.numRays, state.divergence, state.startX, state.startY, state.rayAngle, scene, state.isLightMode]);

  const readout = useMemo(() => {
    const centralRay = new Ray([state.startX, state.startY], state.rayAngle);
    centralRay.cast(scene);
    const yHit1 = centralRay.detectAtX(state.det1X);
    const yHit2 = centralRay.detectAtX(state.det2X);
    const trueOffset = (yHit1 !== null && yHit2 !== null) ? yHit2 - yHit1 : null;

    // Auto-collimator mirror readout: return beam position & angle deviation.
    let mirrorReadout = null;
    if (state.mirrorEnabled && mirror) {
      const mirrorIdx = centralRay.hitObjects.findIndex((r, i) => i > 0 && r === mirror);
      if (mirrorIdx > 0) {
        // y-positions at det1X: [0]=forward pass, [last]=return pass
        const allHits1 = centralRay.detectAllAtX(state.det1X);
        const returnY = allHits1.length >= 2 ? allHits1[allHits1.length - 1] : null;

        // Return-beam exit angle (last path segment), in mrad from horizontal.
        let returnAngleMrad = null;
        const last = centralRay.path.length - 1;
        if (last >= 1) {
          const dx = centralRay.path[last][0] - centralRay.path[last - 1][0];
          const dy = centralRay.path[last][1] - centralRay.path[last - 1][1];
          const len = Math.hypot(dx, dy);
          if (len > 0) {
            returnAngleMrad = Math.asin(Math.max(-1, Math.min(1, dy / len))) * 1000;
          }
        }
        mirrorReadout = { returnY, returnAngleMrad, mirrorIdx };
      }
    }

    return { yHit1, yHit2, trueOffset, pivotMarkerPos, centralRay, mirrorReadout };
  }, [state.startX, state.startY, state.rayAngle, scene, state.det1X, state.det2X, pivotMarkerPos, state.mirrorEnabled, mirror]);

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
      
      <div className="flex-1 relative flex flex-col min-h-0">
        <div className="flex-1 relative min-h-0 flex flex-col">
          <SimulatorCanvas 
            state={state}
            updateState={updateState}
            crystals={crystals}
            rays={rays}
            readout={readout}
            mirror={mirror}
          />
          {state.uiVisible && (
            <ReadoutOverlay 
              state={state}
              updateState={updateState}
              readout={readout}
            />
          )}
          {state.uiVisible && (
            <FootprintOverlay 
              state={state}
              updateState={updateState}
              readout={readout}
            />
          )}
        </div>

        {state.uiVisible && state.showTrajectoryPanel && (
          <TrajectoryPanel
            state={state}
            updateState={updateState}
            onClose={() => updateState('showTrajectoryPanel', false)}
          />
        )}
      </div>
    </div>
  );
};

export default App;
