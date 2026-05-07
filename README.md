# Double-Crystal Monochromator (DCM) Simulator

An interactive X-ray optics simulator built with React, Tailwind CSS, and a custom physics engine. This tool allows users to visualize and calculate the geometry of a goniometer setup, including Bragg angle relationships, ray tracing, and detector readouts.

## 🚀 Live Demo

You can view the live simulator here:
**[https://rachapp.github.io/dcm-simulator/](https://rachapp.github.io/dcm-simulator/)**

## ✨ Features

- **Dynamic Rotation Centers:** Toggle the goniometer pivot between Crystal 1 and Crystal 2.
- **Physics-Linked Controls:** Bidirectional synchronization between X-ray Energy (keV) and Bragg Angle (θ).
- **Auto-Alignment:** "Auto Gap" maintains a fixed beam offset, and "Auto Ray Offset" ensures rays track the crystal rotation.
- **Interactive Canvas:** Smooth zoom and pan functionality with real-time geometric updates.
- **Detector Readouts:** Real-time vertical position tracking at configurable upstream and downstream screens.
- **Theming:** Full support for Day/Night modes.

## 🛠️ Tech Stack

- **Framework:** React 19
- **Styling:** Tailwind CSS 4
- **Build Tool:** Vite 8
- **Icons:** Lucide React
- **Testing:** Vitest

## 📦 Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rachapp/dcm-simulator.git
   cd dcm-simulator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

## 📜 License

MIT
