# Vehicle Rental Service — OS Concurrency & Race Condition Simulator (P5)

An interactive browser-based simulator for the **Producer-Consumer problem** and **race conditions**, using a Vehicle Rental Service as the case study. Built as an Operating Systems course project.

---

## Introduction: The Producer-Consumer Problem

The **Producer-Consumer problem** is a classic synchronization challenge in operating systems. Two processes share a fixed-size buffer:

- The **Producer** generates data and places it into the buffer.
- The **Consumer** removes data from the buffer and uses it.

The buffer has a limited capacity. The Producer must wait when the buffer is full (to avoid **overflow**), and the Consumer must wait when the buffer is empty (to avoid **underflow**). Because both processes access a shared counter, access must be synchronized — otherwise a **race condition** occurs where updates are lost.

---

## Case of Vehicle Rental Service

In this project, the Producer-Consumer problem is showcased through a **Vehicle Rental Service**:

- **Parking bays** = buffer slots (fixed capacity, default: 5 bays)
- **Producer** = parks a vehicle into an available bay (increments the vehicle count)
- **Consumer** = rents a vehicle from an occupied bay (decrements the vehicle count)
- **Shared counter** = tracks how many bays are currently occupied

---

## ⚠️ The Problem Showcased: Race Condition

The simulation demonstrates what happens when the Producer and Consumer access the shared vehicle count **without proper synchronization**:

1. Both the Producer and Consumer read the current count (`old_count`) at the same time.
2. The Producer computes `old_count + 1` and the Consumer computes `old_count - 1`.
3. Whichever thread writes last "wins" — the other thread's update is **lost**.

This is the classic **lost-update race condition**: a non-atomic read-modify-write on shared state produces an incorrect result. The simulation visualizes this interleaving thread-by-thread so you can see exactly how the race unfolds.

---

## 🚀 How to Use the Simulation

### Entry point

Open **`index.html`** in any modern web browser. That is the entry point to the project.

### Running locally

**Option 1 — Open directly:**
```bash
xdg-open index.html
# or
google-chrome index.html
# or
firefox index.html
```

**Option 2 — Local server:**
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000`.

### Controls

| Control | Action |
|---------|--------|
| **Produce** (`1`) | Park a vehicle (Producer). Fails with **Overflow** if all bays are full. |
| **Consume** (`2`) | Rent a vehicle (Consumer). Fails with **Underflow** if no bays are occupied. |
| **Race Condition** (`3`) | Simulate concurrent Producer/Consumer access without locking. |
| **Reset** (`4` or `R`) | Reset the simulation to its initial state. |
| **Auto Sim** (`Space`) | Toggle automatic random Produce/Consume/Race operations. |

### Features
- Visual parking bays showing occupied/empty slots
- Real-time occupancy metrics and progress bar
- Console log with categorized entries (produce, consume, race, warn)
- Light/dark theme toggle
- Audio feedback (toggleable)
- Keyboard shortcuts: `1`, `2`, `3`, `4`/`R`, `Space`

---

## 📁 File Structure

```
P5/
├── index.html              # Entry point — open this in a browser
├── cpp.py                  # Python CLI reference implementation
├── README.md               # This file
└── assets/
    ├── css/
    │   └── style.css       # All styles (light/dark themes)
    └── js/
        └── app.js          # Simulation logic (Producer-Consumer + race condition)
```

---

## 🐍 Python CLI Reference

A command-line version of the same simulation logic is included:

```bash
python3 cpp.py
```

It provides a menu-driven Produce / Consume / Race Condition / Exit interface that mirrors the web simulator.

---

## 🌐 GitHub Pages Deployment

This project is configured for GitHub Pages. To deploy:

1. Push the repository to GitHub (the `main` branch).
2. Go to your repository on GitHub → **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, select **Deploy from a branch**.
4. Choose branch `main` and folder `/ (root)`, then click **Save**.
5. Your site will be published at:  
   `https://AdventBird.github.io/Producer-Consumer-Simulation/`

Because `index.html` is at the repository root, GitHub Pages serves it automatically as the site's home page.
