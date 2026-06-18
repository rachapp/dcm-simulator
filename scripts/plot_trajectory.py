import os
import numpy as np
import matplotlib.pyplot as plt

# Physical configuration for C2-rotation center system
h = 20.0             # beam offset in mm
d_Si111 = 3.1356     # Si 111 d-spacing in Angstroms
HC = 12.3984193      # Planck's constant * c in keV*A

# Scan configuration (100 points)
N_points = 100
sample_index = np.arange(1, N_points + 1)

# Bragg angle scan: linear in theta from 5 to 50 degrees
theta_deg = 5.0 + (sample_index - 1) * (50.0 - 5.0) / (N_points - 1)
theta_rad = np.radians(theta_deg)

# Motorized Stage Calculations (C2 Center of Rotation):
# 1. stage_z (vertical gap g): g(theta) = h / (2 * cos(theta))
stage_z = h / (2 * np.cos(theta_rad))

# 2. stage_y (C1 vertical position): under C2 pivot mode, C2 is fixed at output axis (y=h),
#    C1 vertical stage moves C1 down relative to C2: stage_y = -gap
stage_y = -stage_z

# 3. stage_x (C2 horizontal position - for completeness in CSV): X = h / (2 * sin(theta))
stage_x = h / (2 * np.sin(theta_rad))

# 4. Calculated energy for Si 111 lattice plane: E = HC / (2 * d * sin(theta))
calculated_energy = HC / (2 * d_Si111 * np.sin(theta_rad))

# Create output folder if it doesn't exist
os.makedirs('scripts', exist_ok=True)

# Export generated trajectory data to CSV for manuscript table reference
data = np.column_stack((sample_index, theta_deg, stage_y, stage_z, stage_x, calculated_energy))
header = "N,theta_deg,stage_y_C1_vertical_mm,stage_z_gap_mm,stage_x_C2_horizontal_mm,calculated_energy_Si111_keV"
np.savetxt('scripts/trajectory_data.csv', data, delimiter=',', header=header, comments='')

# Matplotlib settings for publication-ready manuscript styling
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

# Create 2x2 grid layout (theta vs N, energy vs N, stage_y vs N, stage_z vs N)
fig, axs = plt.subplots(2, 2, figsize=(7.5, 6.0), sharex=True)

# Subplot 1: Theta vs N
axs[0, 0].plot(sample_index, theta_deg, color='#1d4ed8', linewidth=2, label=r'$\theta$')
axs[0, 0].set_ylabel('Bragg Angle $\theta$ (deg)')
axs[0, 0].set_title('Bragg Angle vs Sample Index')
axs[0, 0].grid(True)
axs[0, 0].legend(loc='upper left')

# Subplot 2: Calculated Energy vs N
axs[0, 1].plot(sample_index, calculated_energy, color='#b91c1c', linewidth=2, label=r'$E$ (Si 111)')
axs[0, 1].set_ylabel('Energy $E$ (keV)')
axs[0, 1].set_title('Calculated Energy (Si 111)')
axs[0, 1].grid(True)
axs[0, 1].legend(loc='upper right')

# Subplot 3: Stage Y vs N (C1 Vertical)
axs[1, 0].plot(sample_index, stage_y, color='#047857', linewidth=2, label=r'$stage\_y$')
axs[1, 0].set_xlabel('Sample Index ($N$)')
axs[1, 0].set_ylabel('C1 Vertical Stage $Y$ (mm)')
axs[1, 0].set_title(r'C1 Vertical position ($stage\_y$)')
axs[1, 0].grid(True)
axs[1, 0].legend(loc='lower left')

# Subplot 4: Stage Z vs N (Gap)
axs[1, 1].plot(sample_index, stage_z, color='#6d28d9', linewidth=2, label=r'$stage\_z$')
axs[1, 1].set_xlabel('Sample Index ($N$)')
axs[1, 1].set_ylabel('Vertical Gap Stage $Z$ (mm)')
axs[1, 1].set_title(r'Vertical Gap Stage ($stage\_z$)')
axs[1, 1].grid(True)
axs[1, 1].legend(loc='upper left')

# Adjust subplots spacing
plt.tight_layout()

# Save high-resolution figures
plt.savefig('scripts/trajectory_plot.png')
plt.savefig('scripts/trajectory_plot.pdf')

print("Successfully regenerated:")
print("  - Data log: scripts/trajectory_data.csv")
print("  - Figure (PNG): scripts/trajectory_plot.png")
print("  - Figure (PDF): scripts/trajectory_plot.pdf")
