# Double-Crystal Monochromator (DCM) Kinematic & Optical Simulator

## Overview
This repository contains a high-performance, purely client-side simulation of a Double-Crystal Monochromator (DCM) used in synchrotron X-ray beamlines. Developed entirely in HTML5 Canvas and vanilla JavaScript, the simulator features a custom 2D physics and ray-tracing engine. 

It provides real-time visualization of X-ray beam propagation, calculating critical phase-space parameters including beam divergence, Bragg diffraction mechanics, grazing incidence reflection, and precise spatial tracking of macroscopic mechanical stage alignments.

---

## Mathematical Framework & Optics Implementation

The simulator does not rely on external physics libraries; instead, it utilizes a custom-built 2D geometric optics engine. The core of the beam propagation relies on solving parametric line-segment intersection equations and applying vector reflection mathematics.

### 1. Ray Representation & Parametric Geometry
An X-ray beam is modeled as a discrete fan of $N$ rays. Each individual ray is represented by a parametric equation in 2D Cartesian space:
$$\vec{R}(t) = \vec{O} + t\vec{D}$$
Where:
* $\vec{O}$ is the origin vector $(x_0, y_0)$ of the ray.
* $\vec{D}$ is the normalized direction vector $(D_x, D_y)$, derived from the beam angle $\phi$ as $[\cos(\phi), \sin(\phi)]$.
* $t$ is the scalar distance along the ray ($t \ge 0$).

Crystal boundaries are defined as continuous polygons composed of line segments. Each segment is defined parametrically by its vertices $\vec{P}_1$ and $\vec{P}_2$:
$$\vec{S}(u) = \vec{P}_1 + u(\vec{P}_2 - \vec{P}_1)$$
Where $0 \le u \le 1$.

### 2. Ray-Polygon Intersection Solver
To determine if, and exactly where, an X-ray interacts with a crystal surface, the engine must find the intersection of $\vec{R}(t)$ and $\vec{S}(u)$. Equating the two yields:
$$\vec{O} + t\vec{D} = \vec{P}_1 + u(\vec{P}_2 - \vec{P}_1)$$

Let the segment vector be $\vec{L} = \vec{P}_2 - \vec{P}_1$ and the origin delta be $\vec{\Delta} = \vec{O} - \vec{P}_1$. The system is solved using the 2D cross product (determinant method). Defining the perpendicular direction vector $\vec{D}^\perp = [-D_y, D_x]$, we take the dot product of both sides with $\vec{D}^\perp$ to isolate $u$:

$$u = \frac{\vec{\Delta} \cdot \vec{D}^\perp}{\vec{L} \cdot \vec{D}^\perp}$$

Similarly, solving for $t$ yields:
$$t = \frac{L_x \Delta_y - L_y \Delta_x}{\vec{L} \cdot \vec{D}^\perp}$$

**Intersection Criteria:**
A valid, physical hit on the crystal surface is confirmed only if:
1.  The denominator $\vec{L} \cdot \vec{D}^\perp \neq 0$ (the ray and segment are not parallel).
2.  $0 \le u \le 1$ (the intersection lies strictly within the physical bounds of the crystal face).
3.  $t > \epsilon$ (the intersection is ahead of the ray's origin, where $\epsilon \approx 10^{-4}$ handles floating-point inaccuracies and prevents self-intersection loops after a bounce).

### 3. Vector Reflection Mechanics
Once a valid intersection point $\vec{H}$ is found, the new trajectory of the diffracted/reflected X-ray is calculated. 

First, the unit normal vector $\vec{N}$ of the struck crystal face is extracted from the segment vector $\vec{L}$. The reflected direction $\vec{D}_{ref}$ is computed using standard Householder reflection geometry:
$$\vec{D}_{ref} = \vec{D} - 2(\vec{D} \cdot \vec{N})\vec{N}$$
The ray's origin is updated to $\vec{H}$, its direction to $\vec{D}_{ref}$, and the ray-casting algorithm recurses until it exits the system boundary.

### 4. Bragg Diffraction Physics
To map the geometric simulation to actual synchrotron physics, the simulator actively computes the relationship between the physical goniometer rotation, the selected atomic lattice, and the output energy using **Bragg's Law**:
$$\lambda = 2d \sin(\theta_B)$$

In a real beamline, the true Bragg angle $\theta_B$ is relative to the incoming beam's trajectory. Therefore, the engine incorporates the Ray Angle Offset $\phi_{offset}$ into the kinematic equation:
$$\theta_B = \theta_{gonio} - \phi_{offset}$$

Energy conversion operates concurrently using the Planck-Einstein relation:
$$E = \frac{hc}{\lambda}$$
*(Where $hc \approx 12.3984$ keV·Å)*. This creates a fully bidirectional physics linkage: adjusting the goniometer updates the reported output energy, and typing a target Energy (in keV) drives the virtual motors to back-calculate and actuate to the required geometric positions.

### 5. Kinematic Fixed-Exit Calculation
A critical function of a DCM is maintaining a fixed vertical beam offset ($h$) for downstream instrumentation. The vertical stage of Crystal 2 ($Y_2$) is mathematically coupled to the goniometer angle $\theta_B$ to maintain this offset:
$$Y_2 = \frac{h}{2 \cos(\theta_B)}$$
The simulator provides an "Auto-Gap" routine that continuously resolves this equation and drives the virtual $Y$-axis stage in real-time as the energy is swept.

---

## Architecture & Stack
* **Rendering:** Native HTML5 `<canvas>` Context 2D API for high-framerate (60fps) phase-space rendering, eliminating the overhead of standard DOM/SVG manipulation.
* **Styling:** Tailwind CSS (via CDN) for rapid, responsive UI architecture.
* **Dependencies:** Zero external dependencies (No React, Vue, D3, or Three.js). The entire mathematical engine and UI logic are self-contained, guaranteeing long-term stability and trivial deployment.

## Usage
Simply clone this repository and open `index.html` in any modern web browser. No local web server or build step is required.
