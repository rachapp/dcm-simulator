import os
import numpy as np
import matplotlib.pyplot as plt

# Default physical configuration
h = 20.0          # beam offset in mm
theta_min = 5.0   # Bragg angle scan start (degrees)
theta_max = 50.0  # Bragg angle scan end (degrees)
N = 1000          # number of samples

# Theta array
theta_deg = np.linspace(theta_min, theta_max, N)
theta_rad = np.radians(theta_deg)

# 1. Motorized Stage Position Trajectories
# Horizontal translation (C2X): X(theta) = h / (2 * sin(theta))
c2X = h / (2 * np.sin(theta_rad))
# Vertical Gap (g): g(theta) = h / (2 * cos(theta))
g = h / (2 * np.cos(theta_rad))

# 2. Motorized Stage Velocity Trajectories (derivatives w.r.t theta in degrees)
# dx/dtheta = -h * cos(theta) / (2 * sin^2(theta)) * (pi / 180)
# dg/dtheta = h * sin(theta) / (2 * cos^2(theta)) * (pi / 180)
deg_to_rad = np.pi / 180.0
v_c2X = -h * np.cos(theta_rad) / (2 * np.sin(theta_rad)**2) * deg_to_rad
v_g = h * np.sin(theta_rad) / (2 * np.cos(theta_rad)**2) * deg_to_rad

# Create output scripts folder if it doesn't exist
os.makedirs('scripts', exist_ok=True)

# Export generated trajectory data to CSV for external plotting (e.g. Origin/Excel)
data = np.column_stack((theta_deg, c2X, g, v_c2X, v_g))
header = "theta_deg,c2X_position_mm,gap_position_mm,c2X_velocity_mm_per_deg,gap_velocity_mm_per_deg"
np.savetxt('scripts/trajectory_data.csv', data, delimiter=',', header=header, comments='')

# Professional Matplotlib configuration for manuscript-ready quality
plt.rcParams.update({
    'font.family': 'serif',
    'font.size': 10,
    'axes.labelsize': 11,
    'axes.titlesize': 11,
    'xtick.labelsize': 9,
    'ytick.labelsize': 9,
    'legend.fontsize': 9,
    'figure.titlesize': 12,
    'grid.alpha': 0.3,
    'grid.linestyle': '--',
    'savefig.dpi': 300,
    'savefig.bbox': 'tight'
})

# Create 2x2 figure layout
fig, axs = plt.subplots(2, 2, figsize=(7.0, 5.5), sharex=True)

# Plot Horizontal Position
axs[0, 0].plot(theta_deg, c2X, color='#1d4ed8', linewidth=1.8, label=r'$X(\theta)$')
axs[0, 0].set_ylabel('Position $X$ (mm)')
axs[0, 0].set_title('C2 Horizontal Axis ($X$)')
axs[0, 0].grid(True)
axs[0, 0].legend(loc='upper right')

# Plot Horizontal Velocity
axs[0, 1].plot(theta_deg, v_c2X, color='#b91c1c', linewidth=1.8, label=r'$dX/d\theta$')
axs[0, 1].set_ylabel('Velocity $dX/d\theta$ (mm/deg)')
axs[0, 1].set_title('Horizontal Axis Velocity')
axs[0, 1].grid(True)
axs[0, 1].legend(loc='lower right')

# Plot Vertical Gap Position
axs[1, 0].plot(theta_deg, g, color='#047857', linewidth=1.8, label=r'$g(\theta)$')
axs[1, 0].set_xlabel('Bragg Angle $\theta$ (deg)')
axs[1, 0].set_ylabel('Vertical Gap $g$ (mm)')
axs[1, 0].set_title('C2 Vertical Gap Axis ($g$)')
axs[1, 0].grid(True)
axs[1, 0].legend(loc='upper left')

# Plot Vertical Gap Velocity
axs[1, 1].plot(theta_deg, v_g, color='#6d28d9', linewidth=1.8, label=r'$dg/d\theta$')
axs[1, 1].set_xlabel('Bragg Angle $\theta$ (deg)')
axs[1, 1].set_ylabel('Velocity $dg/d\theta$ (mm/deg)')
axs[1, 1].set_title('Vertical Gap Axis Velocity')
axs[1, 1].grid(True)
axs[1, 1].legend(loc='upper left')

# Adjust layout to prevent label overlaps
plt.tight_layout()

# Save as publication-ready high-resolution formats
plt.savefig('scripts/trajectory_plot.png')
plt.savefig('scripts/trajectory_plot.pdf')

print("Successfully generated:")
print("  - Data log: scripts/trajectory_data.csv")
print("  - Figure (PNG): scripts/trajectory_plot.png")
print("  - Figure (PDF): scripts/trajectory_plot.pdf")
