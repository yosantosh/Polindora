# Polindora — Premium Focus Timer

![alt text](<Screenshot From 2026-05-11 05-59-07.png>) ![alt text](<Screenshot From 2026-05-11 05-58-40.png>)

Polindora is a stunning, **dark glassmorphism-inspired** Pomodoro Timer for GNOME Shell. Designed for users who value both productivity and high-end aesthetics, it seamlessly integrates into your workflow with a unique top-panel progress indicator and a powerful, feature-rich preferences suite.

---

## ✨ Why Polindora?

Most Pomodoro timers force you to break your focus just to check the time—requiring you to switch tabs, open menus, or check your phone.

**Polindora's solution: The Top-Panel Progress Indicator.**
We built a sleek, non-intrusive progress line that sits right on your top panel. 
- **Work Bar:** Sits to the right of the clock.
- **Break Bar:** Sits to the left of the clock.
Track your focus at a mere glance without ever leaving your current window.

---

## 🎨 UI & Aesthetics

Polindora isn't just a tool; it's a visual experience.
- **Dark Glassmorphism:** Deep blacks, radial gradients, and backdrop filters create a "liquid glass" feel.
- **Luminous Aesthetics:** Subtle, customizable glow effects and high-contrast typography (Inter/SF Pro) ensure clarity and beauty.
- **Fluid Animations:** Smooth transitions, pulsing idle states, and micro-interactions that make the interface feel alive.
- **Segmented Session Ring:** A beautiful graphical arc on the Home tab that visualizes your progress toward your next long break.

---

## 🚀 Advanced Features

- **Integrated Task Management:** Manage your daily goals directly within the app. Categorize tasks and track their completion.
- **Deep Analytics:** View detailed focus statistics, including daily session counts, total focus minutes, and long-term trends (weekly/all-time).
- **Strict Mode:** For those who need extra discipline—hides pause and skip buttons during work sessions to keep you accountable.
- **Highly Customizable:**
  - **Dynamic Bar Design:** Adjust width, height, and corner radius.
  - **Curated Color Palettes:** Choose from preset themes or create your own with the custom color picker.
  - **Custom Icons:** The top-panel indicator utilizes a sleek Gemini SVG icon, seamlessly integrating into your desktop environment.
- **Smart Notifications:** Gentle audio chimes and desktop alerts ensure you never miss a transition.

---

## 🛠️ Installation

Polindora comes with a robust installation script that handles dependencies and system activation automatically.

1. **Clone or download** this repository.
2. **Open a terminal** in the project directory.
3. **Run the installer:**
   ```bash
   chmod +x install.sh
   ./install.sh
   ```
4. **Restart GNOME Shell (Critical):**
   - **Wayland (Default Ubuntu):** Log out and log back in.
   - **X11:** Press `Alt + F2`, type `r`, and press `Enter`.
5. **Enable:** Open the **Extensions** app and ensure **Polindora** is toggled ON.

---

## 🗑️ Uninstallation

To remove Polindora and (optionally) its configuration data:

1. **Run the uninstaller:**
   ```bash
   chmod +x uninstall.sh
   ./uninstall.sh
   ```
2. Follow the prompts to either keep or wipe your focus statistics and settings.
3. **Restart GNOME Shell** to complete the process.

---

## 📂 Project Structure

Polindora's source code is organized for clean development and easy contribution:
- **`extension.js` & `prefs.js`**: Core extension logic and the preferences window UI.
- **`stylesheet.css`**: Custom glassmorphism styling and animations for GNOME Shell.
- **`icons/`**: Contains custom SVG assets, including the Gemini panel indicator.
- **`tests/`**: Contains all unit and UI tests for ensuring extension stability.
- **`scripts/`**: Development utilities and maintenance scripts.
- **`previews/`**: HTML/CSS mockups used for prototyping the glassmorphism aesthetic.
- **`releases/`**: Compiled extension `.zip` bundles ready for installation.

---

## 📖 How to Use

1. **Start a Session:** Click the Polindora icon in your GNOME top panel. A beautiful glassmorphic menu will appear where you can start your focus session.
2. **Track Progress:** Once started, subtle progress bars will appear on the top panel, letting you know how much time is left without interrupting your workflow.
3. **Manage Tasks & Stats:** Double-click the panel bars or use the settings icon to open the main window. Here you can add tasks, view analytics, and customize your experience.

---

## 📅 Roadmap

We are constantly evolving. Here's what's coming next to Polindora:
- [ ] **Cloud Sync:** Sync your tasks and analytics across multiple GNOME devices.
- [ ] **Custom Soundscapes:** Ambient focus sounds (white noise, rain, lo-fi) integrated directly into the timer.
- [ ] **Keyboard Shortcuts:** Deep integration with GNOME shortcuts for hands-free control.
- [ ] **Advanced Goal Setting:** Set weekly focus targets and receive motivational badges.

---

## 💡 Productivity Tips with Polindora

- **The Power of the Ring:** Use the **Session Ring** on the Home tab to visualize your "Sprint." Aim to fill all segments before taking your Long Break.
- **Strict Mode for Deep Work:** Turn on **Strict Mode** during your most challenging tasks to remove the temptation to "just take a quick break."
- **Categorize for Clarity:** Use the **Task Categories** feature to see exactly where your time is going. Are you spending too much time on emails and not enough on deep coding? The Analytics tab will tell you.
- **Panel Glance:** Train yourself to check the **Top-Panel Bar** instead of opening the menu. This micro-habit reduces context-switching and keeps you in the flow state.

---
*Built for GNOME Shell with focus and aesthetics in mind. Stay focused. 🍅*
