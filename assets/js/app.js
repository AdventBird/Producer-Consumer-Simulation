// --- STATE MANAGEMENT ---
let CAPACITY = 5;
let count = 0;
let vehicles = [];
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

// --- AUDIO SYNTHESIS ---
const audioCtx =
  window.AudioContext || window.webkitAudioContext
    ? new (window.AudioContext || window.webkitAudioContext)()
    : null;

function playTone(type) {
  if (!soundEnabled || !audioCtx) return;

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (type === "produce") {
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  } else if (type === "consume") {
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  } else if (type === "race") {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(580, now + 0.1);
    osc.frequency.linearRampToValueAtTime(260, now + 0.22);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.25);

    osc.start(now);
    osc.stop(now + 0.25);
  } else if (type === "warn") {
    osc.type = "triangle";
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
    <svg viewBox="0 0 64 64" fill="none"
         xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="24" width="52" height="22" rx="7"
            fill="${color}" fill-opacity="0.15"
            stroke="${color}" stroke-width="2.5"/>

      <path d="M16 24L22 14H42L48 24"
            stroke="${color}" stroke-width="2.5"
            stroke-linecap="round" stroke-linejoin="round"/>

      <path d="M22 14L16 24H48L42 14H22Z"
            fill="${color}" fill-opacity="0.3"/>

      <circle cx="18" cy="46" r="6"
              fill="#1e293b" stroke="${color}" stroke-width="2"/>
      <circle cx="18" cy="46" r="2.5" fill="#f8fafc"/>

      <circle cx="46" cy="46" r="6"
              fill="#1e293b" stroke="${color}" stroke-width="2"/>
      <circle cx="46" cy="46" r="2.5" fill="#f8fafc"/>

      <circle cx="56" cy="29" r="2" fill="#fbbf24"/>
      <circle cx="8" cy="29" r="2" fill="#f43f5e"/>
    </svg>
  `;
}

// --- LOGGING ---
function logToConsole(tag, message, category = "info") {
  const now = new Date();
  const timeStr =
    now.toTimeString().split(" ")[0] +
    "." +
    String(now.getMilliseconds()).padStart(3, "0");

  const line = document.createElement("div");
  line.className = "console-line";

  let tagClass = "tag-info";

  if (category === "produce") tagClass = "tag-produce";
  else if (category === "consume") tagClass = "tag-consume";
  else if (category === "race") tagClass = "tag-race";
  else if (category === "warn") tagClass = "tag-warn";

  const time = document.createElement("span");
  time.className = "log-time";
  time.textContent = timeStr;

  const tagElement = document.createElement("span");
  tagElement.className = `log-tag ${tagClass}`;
  tagElement.textContent = `[${tag}]`;

  const messageElement = document.createElement("span");
  messageElement.textContent = message;

  line.append(time, tagElement, messageElement);
  consoleScreen.appendChild(line);

  consoleScreen.scrollTop = consoleScreen.scrollHeight;
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = "toast";

  let strokeColor = "var(--text-main)";

  if (type === "warn") strokeColor = "var(--accent-warn)";
  if (type === "produce") strokeColor = "var(--accent-producer)";
  if (type === "consume") strokeColor = "var(--accent-consumer)";
  if (type === "race") strokeColor = "var(--accent-race)";

  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24"
         fill="none" stroke="${strokeColor}" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  `;

  const text = document.createElement("span");
  text.textContent = message;
  toast.appendChild(text);

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";

    setTimeout(() => toast.remove(), 250);
  }, 2600);
}

// --- UI RENDERING ---
function render() {
  metricCapacity.textContent = CAPACITY;
  metricCount.textContent = count;

  const pct = Math.round((count / CAPACITY) * 100);

  metricOccupancy.textContent = `${pct}% utilized`;
  occupancyBar.style.width = `${pct}%`;

  occupancyBar.style.backgroundColor =
    count === CAPACITY
      ? "var(--accent-warn)"
      : "var(--accent-producer)";

  metricOps.textContent =
    totalOps.produce + totalOps.consume + totalOps.race;

  metricOpsBreakdown.textContent =
    `P:${totalOps.produce} / C:${totalOps.consume} / RC:${totalOps.race}`;

  slotsCountLabel.textContent = `${CAPACITY} BAY STORAGE`;
  footCap.textContent = CAPACITY;

  const capacityPill = document.getElementById("bufferCapacityPill");

  if (capacityPill) {
    capacityPill.textContent = `${count} / ${CAPACITY} In Use`;

    if (count === CAPACITY) {
      capacityPill.className = "buffer-capacity-pill pill-full";
    } else if (count === 0) {
      capacityPill.className = "buffer-capacity-pill pill-empty";
    } else {
      capacityPill.className = "buffer-capacity-pill pill-active";
    }
  }

  // Render parking bays.
  baysGrid.innerHTML = "";
  baysGrid.style.setProperty("--capacity", CAPACITY);

  for (let i = 0; i < CAPACITY; i++) {
    const baySlot = document.createElement("div");
    baySlot.className = "bay-slot";

    const bayNumber = String(i + 1).padStart(2, "0");

    if (i < vehicles.length && vehicles[i]) {
      const vehicle = vehicles[i];

      baySlot.classList.add("occupied");

      baySlot.innerHTML = `
        <div class="slot-header">
          <span class="slot-bay-num">BAY #${bayNumber}</span>
          <span class="slot-status-badge badge-occupied">IN USE</span>
        </div>

        <div class="vehicle-graphic car-enter">
          ${getCarSvg(vehicle.color)}
        </div>

        <div class="vehicle-info">
          <span class="vehicle-id">${vehicle.vin}</span>
          <span class="vehicle-type"></span>
        </div>
      `;

      baySlot.querySelector(".vehicle-type").textContent = vehicle.name;
    } else {
      baySlot.innerHTML = `
        <div class="slot-header">
          <span class="slot-bay-num">BAY #${bayNumber}</span>
          <span class="slot-status-badge badge-empty">EMPTY</span>
        </div>

        <div class="empty-parking-graphic">
          <div class="bay-p-symbol">P</div>
        </div>

        <div class="slot-footer-info">
          <span class="slot-index-mono">SLOT [${i}]</span>
          <span class="slot-label-empty">Available Bay</span>
        </div>
      `;
    }

    baysGrid.appendChild(baySlot);
  }
}

// --- STATUS INDICATOR ---
function setStatus(text, type, detail) {
  statusPill.textContent = text;
  statusPill.className = `status-pill status-${type}`;
  statusDetail.textContent = detail;

  let indicatorColor = "var(--accent-producer)";

  if (type === "overflow") {
    indicatorColor = "var(--accent-warn)";
  } else if (type === "underflow") {
    indicatorColor = "var(--accent-consumer)";
  } else if (type === "race") {
    indicatorColor = "var(--accent-race)";
  }

  stateIndicator.style.background = indicatorColor;
}

// --- 1. PRODUCE ---
function handleProduce() {
  totalOps.produce++;

  if (count < CAPACITY) {
    count++;

    const model =
      VEHICLE_MODELS[vehicleIdCounter % VEHICLE_MODELS.length];

    const newVehicle = {
      vin: `VIN-${vehicleIdCounter++}`,
      name: model.name,
      type: model.type,
      color: model.color
    };

    vehicles.push(newVehicle);

    playTone("produce");

    setStatus(
      "Vehicle Stored",
      "normal",
      `Buffer: ${count}/${CAPACITY}`
    );

    logToConsole(
      "PRODUCE",
      `Producer added a vehicle (${newVehicle.vin}). Count: ${count}`,
      "produce"
    );

    render();
  } else {
    playTone("warn");

    setStatus("Overflow", "overflow", "Capacity reached");

    logToConsole(
      "OVERFLOW",
      "OVERFLOW! Warehouse is full. Cannot produce.",
      "warn"
    );

    showToast("OVERFLOW! Warehouse is full.", "warn");
    render();
  }
}

// --- 2. CONSUME ---
function handleConsume() {
  totalOps.consume++;

  if (count > 0) {
    const removed = vehicles.pop();
    count--;

    playTone("consume");

    setStatus(
      "Vehicle Rented",
      "normal",
      `Buffer: ${count}/${CAPACITY}`
    );

    logToConsole(
      "CONSUME",
      `Consumer rented a vehicle (${removed ? removed.vin : "Car"}). Count: ${count}`,
      "consume"
    );

    render();
  } else {
    playTone("warn");

    setStatus("Underflow", "underflow", "Buffer empty");

    logToConsole(
      "UNDERFLOW",
      "UNDERFLOW! No vehicles available to rent.",
      "warn"
    );

    showToast("UNDERFLOW! No vehicles available.", "warn");
    render();
  }
}

// --- 3. RACE CONDITION ---
function handleRaceCondition() {
  totalOps.race++;

  if (count > 0 && count < CAPACITY) {
    playTone("race");

    const oldCount = count;
    const producerResult = oldCount + 1;
    const consumerResult = oldCount - 1;

    prodReadVal.textContent = oldCount;
    prodComputeVal.textContent =
      `${oldCount} + 1 = ${producerResult}`;

    consReadVal.textContent = oldCount;
    consComputeVal.textContent =
      `${oldCount} - 1 = ${consumerResult}`;

    const isProducerLast = Math.random() < 0.5;
    const winner = isProducerLast ? "Producer" : "Consumer";

    count = isProducerLast ? producerResult : consumerResult;

    while (vehicles.length < count) {
      const model =
        VEHICLE_MODELS[vehicleIdCounter % VEHICLE_MODELS.length];

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

    raceResultBanner.classList.add("highlight");
    raceResultBanner.classList.add("show");

    raceResultText.innerHTML = `
      <strong>RACE CONDITION OCCURRED!</strong>
      Both threads read initial count <code>${oldCount}</code>
      simultaneously.
      <strong>${winner}</strong> won the interleaving and wrote last.
      Final Count: <strong>${count}</strong>
      (Lost update on ${winner === "Producer" ? "Consumer" : "Producer"}).
    `;

    logToConsole(
      "RACE_COND",
      `Producer reads: ${oldCount} | wants to write: ${producerResult}`,
      "race"
    );

    logToConsole(
      "RACE_COND",
      `Consumer reads: ${oldCount} | wants to write: ${consumerResult}`,
      "race"
    );

    logToConsole(
      "RACE_COND",
      `RACE CONDITION! ${winner} writes last. Final Count: ${count}`,
      "race"
    );

    showToast(
      `RACE CONDITION! ${winner} writes last → Count: ${count}`,
      "race"
    );

    render();

    const slots = document.querySelectorAll(".bay-slot");

    slots.forEach(slot => slot.classList.add("highlight-race"));

    setTimeout(() => {
      document
        .querySelectorAll(".bay-slot")
        .forEach(slot => slot.classList.remove("highlight-race"));
    }, 1200);
  } else {
    playTone("warn");

    setStatus("Race Invalid", "overflow", "Count out of range");

    const message =
      `Race condition requires count between 1 and ${CAPACITY - 1} ` +
      `(Current count: ${count})`;

    logToConsole("WARNING", message, "warn");
    showToast(message, "warn");
  }
}

// --- RESET STATE ---
function resetSimulation() {
  if (autoSimInterval) {
    clearInterval(autoSimInterval);
    autoSimInterval = null;

    autoSimText.textContent = "Start Auto Simulation";
    autoSimBtn.classList.remove("btn-produce");
    autoSimBtn.classList.add("btn-outline");

    autoSimIcon.innerHTML =
      `<polygon points="5 3 19 12 5 21 5 3"/>`;
  }

  count = 0;
  vehicles = [];
  vehicleIdCounter = 101;

  totalOps = {
    produce: 0,
    consume: 0,
    race: 0
  };

  prodReadVal.textContent = "-";
  prodComputeVal.textContent = "-";
  consReadVal.textContent = "-";
  consComputeVal.textContent = "-";

  raceResultBanner.classList.remove("highlight");
  raceResultBanner.classList.remove("show");

  raceResultText.innerHTML =
    `Trigger <strong>Option 3 (Race Condition)</strong> when count ` +
    `is between 1 and ${CAPACITY - 1} to witness thread interleaving.`;

  setStatus("Synchronized", "normal", "Buffer Reset");

  logToConsole(
    "SYS",
    "Simulation reset to initial state. Count: 0",
    "info"
  );

  render();
}

// --- AUTO SIMULATION ---
function toggleAutoSim() {
  if (autoSimInterval) {
    clearInterval(autoSimInterval);
    autoSimInterval = null;

    autoSimText.textContent = "Start Auto Simulation";

    autoSimBtn.classList.remove("btn-produce");
    autoSimBtn.classList.add("btn-outline");

    autoSimIcon.innerHTML =
      `<polygon points="5 3 19 12 5 21 5 3"/>`;

    logToConsole("SYS", "Auto simulation stopped.", "info");
  } else {
    autoSimText.textContent = "Stop Auto Simulation";

    autoSimBtn.classList.remove("btn-outline");
    autoSimBtn.classList.add("btn-produce");

    autoSimIcon.innerHTML = `
      <rect x="6" y="4" width="4" height="16"/>
      <rect x="14" y="4" width="4" height="16"/>
    `;

    logToConsole(
      "SYS",
      `Auto simulation started (interval: ${simSpeed.value}ms).`,
      "info"
    );

    autoSimInterval = setInterval(() => {
      const rand = Math.random();

      if (count > 0 && count < CAPACITY && rand < 0.28) {
        handleRaceCondition();
      } else if (rand < 0.65) {
        handleProduce();
      } else {
        handleConsume();
      }
    }, Number.parseInt(simSpeed.value, 10));
  }
}

// --- EVENT LISTENERS ---
btnProduce.addEventListener("click", handleProduce);
btnConsume.addEventListener("click", handleConsume);
btnRace.addEventListener("click", handleRaceCondition);
resetBtn.addEventListener("click", resetSimulation);
autoSimBtn.addEventListener("click", toggleAutoSim);

// Simulation speed control.
simSpeed.addEventListener("input", event => {
  speedDisplay.textContent =
    `${(Number(event.target.value) / 1000).toFixed(1)}s`;

  if (autoSimInterval) {
    toggleAutoSim();
    toggleAutoSim();
  }
});

// Warehouse capacity control.
capSlider.addEventListener("input", event => {
  const newCapacity = Number.parseInt(event.target.value, 10);

  CAPACITY = newCapacity;
  capConfigDisplay.textContent = newCapacity;

  if (count > CAPACITY) {
    count = CAPACITY;
    vehicles = vehicles.slice(0, CAPACITY);
  }

  if (prodReadVal.textContent === "-") {
    raceResultText.innerHTML =
      `Trigger <strong>Option 3 (Race Condition)</strong> when count ` +
      `is between 1 and ${CAPACITY - 1} to witness thread interleaving.`;
  }

  logToConsole(
    "SYS",
    `Warehouse capacity adjusted to ${CAPACITY}.`,
    "info"
  );

  render();
});

// Clear execution log.
clearLogBtn.addEventListener("click", () => {
  consoleScreen.innerHTML = "";

  logToConsole(
    "SYS",
    "Console log cleared.",
    "info"
  );
});

// --- THEME TOGGLE ---
let isDark = true;

document.body.setAttribute("data-theme", "dark");
updateThemeIcon(true);

themeToggle.addEventListener("click", () => {
  isDark = !isDark;

  document.body.setAttribute(
    "data-theme",
    isDark ? "dark" : "light"
  );

  updateThemeIcon(isDark);
});

function updateThemeIcon(dark) {
  const themeIcon = document.getElementById("themeIcon");

  if (!themeIcon) return;

  if (dark) {
    themeIcon.innerHTML = `
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    `;
  } else {
    themeIcon.innerHTML = `
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    `;
  }
}

// --- SOUND TOGGLE ---
soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;

  soundToggle.style.color = soundEnabled
    ? "var(--text-main)"
    : "var(--text-subtle)";

  showToast(
    soundEnabled
      ? "Audio feedback enabled"
      : "Audio feedback muted",
    "info"
  );
});

// --- KEYBOARD SHORTCUTS ---
window.addEventListener("keydown", event => {
  const target = event.target;

  if (
    target &&
    (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    )
  ) {
    return;
  }

  if (event.key === "1") {
    handleProduce();
  } else if (event.key === "2") {
    handleConsume();
  } else if (event.key === "3") {
    handleRaceCondition();
  } else if (
    event.key === "4" ||
    event.key === "r" ||
    event.key === "R"
  ) {
    resetSimulation();
  } else if (event.code === "Space") {
    event.preventDefault();
    toggleAutoSim();
  }
});

// --- INITIALIZE ---
logToConsole(
  "SYS",
  "Vehicle Rental Service Concurrency Simulator initialized.",
  "info"
);

logToConsole(
  "SYS",
  "Bounded Buffer Capacity: 5. Use [1], [2], [3] or on-screen buttons.",
  "info"
);

render();