// --- STATE MANAGEMENT ---
let CAPACITY = 5;
let count = 0;
let vehicles = []; // Array of vehicle objects currently in buffer
let vehicleIdCounter = 101;
let totalOps = { produce: 0, consume: 0, race: 0 };
let autoSimInterval = null;
let soundEnabled = true;

const VEHICLE_MODELS = [
  { name: "Sedan Sprint", type: "Electric Sedan", color: "#0d9488" },
  { name: "Nordic SUV", type: "Hybrid SUV", color: "#3b82f6" },
  { name: "Urban Compact", type: "Hatchback", color: "#8b5cf6" },
  { name: "Apex Roadster", type: "Sport Coupe", color: "#f59e0b" },
  { name: "Veloce GT", type: "Luxury GT", color: "#ec4899" }
];

// --- DOM REFERENCES ---
const metricCapacity = document.getElementById("metricCapacity");
const metricCount = document.getElementById("metricCount");
const metricOccupancy = document.getElementById("metricOccupancy");
const occupancyBar = document.getElementById("occupancyBar");
const statusPill = document.getElementById("statusPill");
const statusDetail = document.getElementById("statusDetail");
const stateIndicator = document.getElementById("stateIndicator");
const metricOps = document.getElementById("metricOps");
const metricOpsBreakdown = document.getElementById("metricOpsBreakdown");
const baysGrid = document.getElementById("baysGrid");
const slotsCountLabel = document.getElementById("slotsCountLabel");
const footCap = document.getElementById("footCap");

const btnProduce = document.getElementById("btnProduce");
const btnConsume = document.getElementById("btnConsume");
const btnRace = document.getElementById("btnRace");
const resetBtn = document.getElementById("resetBtn");

const autoSimBtn = document.getElementById("autoSimBtn");
const autoSimText = document.getElementById("autoSimText");
const autoSimIcon = document.getElementById("autoSimIcon");
const simSpeed = document.getElementById("simSpeed");
const speedDisplay = document.getElementById("speedDisplay");
const capSlider = document.getElementById("capSlider");
const capConfigDisplay = document.getElementById("capConfigDisplay");

const consoleScreen = document.getElementById("consoleScreen");
const clearLogBtn = document.getElementById("clearLogBtn");
const themeToggle = document.getElementById("themeToggle");
const soundToggle = document.getElementById("soundToggle");
const toastContainer = document.getElementById("toastContainer");

const prodReadVal = document.getElementById("prodReadVal");
const prodComputeVal = document.getElementById("prodComputeVal");
const consReadVal = document.getElementById("consReadVal");
const consComputeVal = document.getElementById("consComputeVal");
const raceResultBanner = document.getElementById("raceResultBanner");
const raceResultText = document.getElementById("raceResultText");

// --- AUDIO SYNTHESIS (Web Audio) ---
const audioCtx = (window.AudioContext || window.webkitAudioContext) ? new (window.AudioContext || window.webkitAudioContext)() : null;

function playTone(type) {
  if (!soundEnabled || !audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  const now = audioCtx.currentTime;
  if (type === 'produce') {
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (type === 'consume') {
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (type === 'race') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(580, now + 0.1);
    osc.frequency.linearRampToValueAtTime(260, now + 0.22);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.25);
    osc.start(now);
    osc.stop(now + 0.25);
  } else if (type === 'warn') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(180, now + 0.08);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  }
}

// --- CAR SVG GENERATOR ---
function getCarSvg(color) {
  return `
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="24" width="52" height="22" rx="7" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="2.5"/>
      <path d="M16 24L22 14H42L48 24" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M22 14L16 24H48L42 14H22Z" fill="${color}" fill-opacity="0.3"/>
      <circle cx="18" cy="46" r="6" fill="#1e293b" stroke="${color}" stroke-width="2"/>
      <circle cx="18" cy="46" r="2.5" fill="#f8fafc"/>
      <circle cx="46" cy="46" r="6" fill="#1e293b" stroke="${color}" stroke-width="2"/>
      <circle cx="46" cy="46" r="2.5" fill="#f8fafc"/>
      <circle cx="56" cy="29" r="2" fill="#fbbf24"/>
      <circle cx="8" cy="29" r="2" fill="#f43f5e"/>
    </svg>
  `;
}

// --- LOGGING ---
function logToConsole(tag, message, category = 'info') {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
  
  const line = document.createElement("div");
  line.className = "console-line";
  
  let tagClass = "tag-info";
  if (category === 'produce') tagClass = "tag-produce";
  else if (category === 'consume') tagClass = "tag-consume";
  else if (category === 'race') tagClass = "tag-race";
  else if (category === 'warn') tagClass = "tag-warn";

  line.innerHTML = `
    <span class="log-time">${timeStr}</span>
    <span class="log-tag ${tagClass}">[${tag}]</span>
    <span>${message}</span>
  `;
  
  consoleScreen.appendChild(line);
  consoleScreen.scrollTop = consoleScreen.scrollHeight;
}

function showToast(text, type = "info") {
  const toast = document.createElement("div");
  toast.className = "toast";
  
  let strokeColor = "var(--text-main)";
  if (type === "warn") strokeColor = "var(--accent-warn)";
  if (type === "produce") strokeColor = "var(--accent-producer)";
  if (type === "consume") strokeColor = "var(--accent-consumer)";
  if (type === "race") strokeColor = "var(--accent-race)";

  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${strokeColor}" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <span>${text}</span>
  `;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 2600);
}

// --- UI RENDER & UPDATE ---
function render() {
  metricCapacity.textContent = CAPACITY;
  metricCount.textContent = count;
  const pct = Math.round((count / CAPACITY) * 100);
  metricOccupancy.textContent = `${pct}% utilized`;
  occupancyBar.style.width = `${pct}%`;

  if (count === CAPACITY) {
    occupancyBar.style.backgroundColor = "var(--accent-warn)";
  } else {
    occupancyBar.style.backgroundColor = "var(--accent-producer)";
  }

  metricOps.textContent = totalOps.produce + totalOps.consume + totalOps.race;
  metricOpsBreakdown.textContent = `P:${totalOps.produce} / C:${totalOps.consume} / RC:${totalOps.race}`;
  slotsCountLabel.textContent = `${CAPACITY} BAY STORAGE`;
  footCap.textContent = CAPACITY;

  // Render bays
  baysGrid.innerHTML = "";
  for (let i = 0; i < CAPACITY; i++) {
    const baySlot = document.createElement("div");
    baySlot.className = "bay-slot";
    const bayNumber = String(i + 1).padStart(2, '0');

    if (i < vehicles.length && vehicles[i]) {
      const veh = vehicles[i];
      baySlot.classList.add("occupied");
      baySlot.innerHTML = `
        <div class="slot-label">
          <span>BAY #${bayNumber}</span>
          <span class="slot-index">OCCUPIED</span>
        </div>
        <div class="vehicle-graphic car-enter">
          ${getCarSvg(veh.color)}
        </div>
        <div class="vehicle-info">
          <span class="vehicle-id">${veh.vin}</span>
          <span class="vehicle-type">${veh.name}</span>
        </div>
      `;
    } else {
      baySlot.innerHTML = `
        <div class="slot-label">
          <span>BAY #${bayNumber}</span>
          <span class="slot-index">EMPTY</span>
        </div>
        <div class="empty-state-tag">Available Bay</div>
        <div style="font-size:0.65rem; color:var(--text-subtle); font-family:var(--font-mono);">
          SLOT [${i}]
        </div>
      `;
    }
    baysGrid.appendChild(baySlot);
  }
}

function setStatus(text, type, detail) {
  statusPill.textContent = text;
  statusPill.className = `status-pill status-${type}`;
  statusDetail.textContent = detail;
  
  let indicatorColor = "var(--accent-producer)";
  if (type === "overflow") indicatorColor = "var(--accent-warn)";
  else if (type === "underflow") indicatorColor = "var(--accent-consumer)";
  else if (type === "race") indicatorColor = "var(--accent-race)";
  stateIndicator.style.background = indicatorColor;
}

// --- ACTIONS (Matching cpp.py logic exactly) ---

// 1. PRODUCE
function handleProduce() {
  totalOps.produce++;
  if (count < CAPACITY) {
    count++;
    const model = VEHICLE_MODELS[(vehicleIdCounter) % VEHICLE_MODELS.length];
    const newVehicle = {
      vin: `VIN-${vehicleIdCounter++}`,
      name: model.name,
      type: model.type,
      color: model.color
    };
    vehicles.push(newVehicle);
    playTone('produce');
    setStatus("Vehicle Stored", "normal", `Buffer: ${count}/${CAPACITY}`);
    logToConsole("PRODUCE", `Producer added a vehicle (${newVehicle.vin}). Count: ${count}`, "produce");
    render();
  } else {
    playTone('warn');
    setStatus("Overflow", "overflow", "Capacity reached");
    logToConsole("OVERFLOW", "OVERFLOW! Warehouse is full. Cannot produce.", "warn");
    showToast("OVERFLOW! Warehouse is full.", "warn");
    render();
  }
}

// 2. CONSUME
function handleConsume() {
  totalOps.consume++;
  if (count > 0) {
    const removed = vehicles.pop();
    count--;
    playTone('consume');
    setStatus("Vehicle Rented", "normal", `Buffer: ${count}/${CAPACITY}`);
    logToConsole("CONSUME", `Consumer rented a vehicle (${removed ? removed.vin : 'Car'}). Count: ${count}`, "consume");
    render();
  } else {
    playTone('warn');
    setStatus("Underflow", "underflow", "Buffer empty");
    logToConsole("UNDERFLOW", "UNDERFLOW! No vehicles available to rent.", "warn");
    showToast("UNDERFLOW! No vehicles available.", "warn");
    render();
  }
}

// 3. RACE CONDITION
function handleRaceCondition() {
  totalOps.race++;

  if (count > 0 && count < CAPACITY) {
    playTone('race');
    const old_count = count;
    const producer_result = old_count + 1;
    const consumer_result = old_count - 1;

    prodReadVal.textContent = old_count;
    prodComputeVal.textContent = `${old_count} + 1 = ${producer_result}`;
    consReadVal.textContent = old_count;
    consComputeVal.textContent = `${old_count} - 1 = ${consumer_result}`;

    const isProducerLast = Math.random() < 0.5;
    const winner = isProducerLast ? "Producer" : "Consumer";
    count = isProducerLast ? producer_result : consumer_result;

    while (vehicles.length < count) {
      const model = VEHICLE_MODELS[(vehicleIdCounter) % VEHICLE_MODELS.length];
      vehicles.push({
        vin: `VIN-${vehicleIdCounter++}`,
        name: model.name,
        type: model.type,
        color: model.color
      });
    }
    while (vehicles.length > count) {
      vehicles.pop();
    }

    setStatus("Race Condition", "race", `${winner} wrote last`);
    
    raceResultBanner.style.background = "var(--accent-race-light)";
    raceResultBanner.style.borderColor = "var(--accent-race-border)";
    raceResultText.innerHTML = `
      <strong>RACE CONDITION OCCURRED!</strong> Both threads read initial count <code>${old_count}</code> simultaneously. 
      <strong>${winner}</strong> won the interleaving and wrote last. Final Count: <strong>${count}</strong> (Lost update on ${winner === 'Producer' ? 'Consumer' : 'Producer'}).
    `;

    logToConsole("RACE_COND", `Producer reads: ${old_count} | wants to write: ${producer_result}`, "race");
    logToConsole("RACE_COND", `Consumer reads: ${old_count} | wants to write: ${consumer_result}`, "race");
    logToConsole("RACE_COND", `RACE CONDITION! ${winner} writes last. Final Count: ${count}`, "race");

    showToast(`RACE CONDITION! ${winner} writes last → Count: ${count}`, "race");
    render();

    const slots = document.querySelectorAll('.bay-slot');
    slots.forEach(s => s.classList.add('highlight-race'));
    setTimeout(() => {
      slots.forEach(s => s.classList.remove('highlight-race'));
    }, 1200);

  } else {
    playTone('warn');
    setStatus("Race Invalid", "overflow", "Count out of range");
    const msg = `Race condition requires count between 1 and ${CAPACITY - 1} (Current count: ${count})`;
    logToConsole("WARNING", msg, "warn");
    showToast(msg, "warn");
  }
}

// --- RESET STATE ---
function resetSimulation() {
  count = 0;
  vehicles = [];
  vehicleIdCounter = 101;
  totalOps = { produce: 0, consume: 0, race: 0 };
  prodReadVal.textContent = "-";
  prodComputeVal.textContent = "-";
  consReadVal.textContent = "-";
  consComputeVal.textContent = "-";
  raceResultText.innerHTML = `Trigger <strong>Option 3 (Race Condition)</strong> when count is between 1 and ${CAPACITY - 1} to witness thread interleaving.`;
  setStatus("Synchronized", "normal", "Buffer Reset");
  logToConsole("SYS", "Simulation reset to initial state. Count: 0", "info");
  render();
}

// --- AUTO SIMULATION MODE ---
function toggleAutoSim() {
  if (autoSimInterval) {
    clearInterval(autoSimInterval);
    autoSimInterval = null;
    autoSimText.textContent = "Start Auto Simulation";
    autoSimBtn.classList.remove("btn-produce");
    autoSimBtn.classList.add("btn-outline");
    autoSimIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
    logToConsole("SYS", "Auto simulation stopped.", "info");
  } else {
    autoSimText.textContent = "Stop Auto Simulation";
    autoSimBtn.classList.remove("btn-outline");
    autoSimBtn.classList.add("btn-produce");
    autoSimIcon.innerHTML = `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;
    logToConsole("SYS", `Auto simulation started (interval: ${simSpeed.value}ms).`, "info");
    
    autoSimInterval = setInterval(() => {
      const rand = Math.random();
      if (count > 0 && count < CAPACITY && rand < 0.28) {
        handleRaceCondition();
      } else if (rand < 0.65) {
        handleProduce();
      } else {
        handleConsume();
      }
    }, parseInt(simSpeed.value, 10));
  }
}

// --- EVENT LISTENERS ---
btnProduce.addEventListener("click", handleProduce);
btnConsume.addEventListener("click", handleConsume);
btnRace.addEventListener("click", handleRaceCondition);
resetBtn.addEventListener("click", resetSimulation);
autoSimBtn.addEventListener("click", toggleAutoSim);

simSpeed.addEventListener("input", (e) => {
  speedDisplay.textContent = `${(e.target.value / 1000).toFixed(1)}s`;
  if (autoSimInterval) {
    toggleAutoSim();
    toggleAutoSim();
  }
});

capSlider.addEventListener("input", (e) => {
  const newCap = parseInt(e.target.value, 10);
  CAPACITY = newCap;
  capConfigDisplay.textContent = newCap;
  if (count > CAPACITY) {
    count = CAPACITY;
    vehicles = vehicles.slice(0, count);
  }
  logToConsole("SYS", `Warehouse capacity adjusted to ${CAPACITY}.`, "info");
  render();
});

clearLogBtn.addEventListener("click", () => {
  consoleScreen.innerHTML = "";
  logToConsole("SYS", "Console log cleared.", "info");
});

// Theme Toggle
let isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
if (isDark) {
  document.body.setAttribute("data-theme", "dark");
  updateThemeIcon(true);
}

themeToggle.addEventListener("click", () => {
  isDark = !isDark;
  if (isDark) {
    document.body.setAttribute("data-theme", "dark");
    updateThemeIcon(true);
  } else {
    document.body.removeAttribute("data-theme");
    updateThemeIcon(false);
  }
});

function updateThemeIcon(dark) {
  const themeIcon = document.getElementById("themeIcon");
  if (dark) {
    themeIcon.innerHTML = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
  } else {
    themeIcon.innerHTML = `<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>`;
  }
}

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.style.color = soundEnabled ? "var(--text-main)" : "var(--text-subtle)";
  showToast(soundEnabled ? "Audio feedback enabled" : "Audio feedback muted", "info");
});

// Keyboard Shortcuts (1, 2, 3, 4)
window.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT") return;
  if (e.key === "1") handleProduce();
  else if (e.key === "2") handleConsume();
  else if (e.key === "3") handleRaceCondition();
  else if (e.key === "4" || e.key === "r" || e.key === "R") resetSimulation();
  else if (e.key === " ") {
    e.preventDefault();
    toggleAutoSim();
  }
});

// Initialize
logToConsole("SYS", "Vehicle Rental Service Concurrency Simulator initialized.", "info");
logToConsole("SYS", "Bounded Buffer Capacity: 5. Use [1], [2], [3] or on-screen buttons.", "info");
render();

