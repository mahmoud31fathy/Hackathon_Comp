# Blender 3D: Viewport Movement & POV Guide

Navigating a 3D environment can feel like learning to fly a drone for the first time—it’s a bit disorienting until the muscle memory kicks in. Blender uses a combination of mouse shortcuts and "View Modes" to handle how you interact with the digital space.

## 1. Basic Navigation (The "Mouse-First" Approach)
Blender is heavily optimized for a three-button mouse. If you are on a trackpad, it is highly recommended to turn on **"Emulate 3 Button Mouse"** in the Preferences (`Edit > Preferences > Input`).

* **Rotate (Orbit):** Click and hold the **Middle Mouse Button (MMB)**. This rotates the view around a central pivot point.
* **Pan (Slide):** Hold **Shift + MMB**. This moves the view up, down, left, or right without rotating.
* **Zoom:** Scroll the **Mouse Wheel** or hold **Ctrl + MMB** and move the mouse up/down for a smoother zoom.

> *Placeholder: [Insert image of Blender 3D viewport navigation gizmo]*

---

## 2. Perspective vs. Orthographic
This is a crucial distinction for precision modeling. You can toggle between these using **Numpad 5**.

* **Perspective:** This mimics the real world. Objects farther away appear smaller. It’s best for "feeling" the scene.
* **Orthographic:** This removes all depth distortion. A cube looks the same whether it’s 1 meter or 100 meters away. This is vital for aligning parts perfectly.

---

## 3. The "POV" Presets (Numpad Shortcuts)
Blender uses the Numpad to snap the camera to specific, perfect angles. If you don't have a Numpad, you can use the **Gizmo** (the colored X, Y, Z circles in the top right) to click into these views.

| Shortcut | Viewpoint | Axis Perspective |
| :--- | :--- | :--- |
| **Numpad 1** | Front | Looking down the Y-axis |
| **Numpad 3** | Right Side | Looking down the X-axis |
| **Numpad 7** | Top | Looking down the Z-axis |
| **Numpad 9** | Opposite | Flips your current view (e.g., Front becomes Back) |
| **Numpad 0** | Camera View | Shows exactly what will be rendered |

> *Placeholder: [Insert image of Blender viewport axis orientation]*

---

## 4. "Walk" and "Fly" Modes
If you are coming from a gaming background or working on a large architectural set, standard orbiting can be restrictive. You can enter a **First-Person POV**:

1. Press **Shift + `** (the backtick/tilde key).
2. Use **W, A, S, D** to move and your mouse to look around.
3. Press **Q** and **E** to move vertically.
4. **Left-click** to "set" the view or **Right-click** to teleport back to where you started.

---

## 5. Viewport Lock & Pivot Points
Sometimes you’ll rotate and find your object has disappeared "off-screen." 

* **Frame Selected:** Press **Numpad . (Period)**. This zooms you directly onto the selected object and resets your rotation pivot to that object. It is the "panic button" for when you get lost in 3D space.