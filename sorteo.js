/**
 * JST Power Equipment - Sorteo de Posada 2025
 *
 * REGLAS ESPECIALES:
 * - ID 39:
 *    1ra vez → LUIS
 *    2da vez → ANGEL
 *    3ra+ → cualquiera elegible
 * - Re-rifas tienen animación de shuffle
 */

const LUIS = "SALCIDO MENDEZ LUIS ANGEL";
const ANGEL = "ANGEL DANIEL SANCHEZ SARABIA";

const idsAsadores = [
  "43",
  "44",
  "45",
  "49",
  "54",
  "59",
  "65",
  "66",
  "69",
  "74",
];

// =======================
// ESTADO GLOBAL
// =======================
let participantes = [];
let regalos = [];
let elegibles = [];
let disponibles = [];
let historial = [];

let veces39Rifado = 0;

// =======================
// DOM
// =======================
const btnRifar5 = document.getElementById("btnRifar5");
const ganadoresActualesEl = document.getElementById("ganadoresActuales");
const historialEl = document.getElementById("historial");
const statElegibles = document.getElementById("stat-elegibles");
const statDisponibles = document.getElementById("stat-disponibles");

// =======================
// INIT
// =======================
async function init() {
  const [resP, resR] = await Promise.all([
    fetch("participantes.json"),
    fetch("regalos.json"),
  ]);

  participantes = await resP.json();
  regalos = await resR.json();

  elegibles = participantes.filter((p) => p !== LUIS && p !== ANGEL);

  disponibles = [...regalos];

  actualizarStats();
  btnRifar5.disabled = false;
}

function actualizarStats() {
  statElegibles.innerText = elegibles.length;
  statDisponibles.innerText = disponibles.length;
}

// =======================
// BOTÓN PRINCIPAL
// =======================
btnRifar5.onclick = () => {
  const num = Math.min(5, elegibles.length, disponibles.length);
  if (num === 0) return;

  btnRifar5.disabled = true;
  ganadoresActualesEl.innerHTML = "";

  const slots = [];

  for (let i = 0; i < num; i++) {
    const rIdx = Math.floor(Math.random() * disponibles.length);
    const regalo = disponibles.splice(rIdx, 1)[0];

    const card = crearCard(regalo, "GIRANDO...");
    ganadoresActualesEl.appendChild(card);
    slots.push({ card, regalo });
  }

  animarShuffle(slots, () => completarSorteo(slots));
};

// =======================
// SHUFFLE GENÉRICO
// =======================
function animarShuffle(slots, callback) {
  const start = Date.now();
  const duration = 4000;

  const interval = setInterval(() => {
    slots.forEach((slot) => {
      const idx = Math.floor(Math.random() * elegibles.length);
      slot.card.querySelector(".name-display").innerText = elegibles[idx];
    });

    if (Date.now() - start >= duration) {
      clearInterval(interval);
      callback();
    }
  }, 80);
}

// =======================
// LÓGICA CENTRAL
// =======================
function completarSorteo(slots) {
  const slot39 = slots.find((s) => s.regalo.id === "39");

  if (slot39) {
    veces39Rifado++;

    if (veces39Rifado === 1) slot39.ganador = LUIS;
    else if (veces39Rifado === 2) slot39.ganador = ANGEL;
    else slot39.ganador = sacarElegible();

    slot39.procesado = true;
    finalizarSlot(slot39);
  }

  slots.forEach((slot) => {
    if (slot.procesado) return;

    slot.ganador = sacarElegible();
    slot.procesado = true;
    finalizarSlot(slot);
  });

  actualizarStats();
  actualizarHistorialUI();
  btnRifar5.disabled = false;
}

function sacarElegible() {
  const idx = Math.floor(Math.random() * elegibles.length);
  return elegibles.splice(idx, 1)[0];
}

// =======================
// FINALIZAR SLOT
// =======================
function finalizarSlot(slot) {
  const item = { ganador: slot.ganador, regalo: slot.regalo };
  historial.push(item);
  actualizarUIInmediata(slot, slot.ganador, item);
}

// =======================
// UI
// =======================
function crearCard(regalo, texto) {
  const card = document.createElement("div");
  card.className =
    "bg-white border-b-8 border-jst-blue p-6 shadow-md h-56 flex flex-col justify-between winner-card";

  card.innerHTML = `
    <div class="text-jst-red font-bold-jst text-5xl">#${regalo.id}</div>
    <div class="name-display text-xl font-bold-jst text-slate-300 uppercase min-h-[3rem] flex items-center">
      ${texto}
    </div>
    <div class="text-slate-400 text-[10px] font-bold uppercase italic border-t pt-2">
      ${regalo.nombre}
    </div>
  `;
  return card;
}

function actualizarUIInmediata(slot, ganador, item) {
  const el = slot.card.querySelector(".name-display");
  el.innerText = ganador;
  el.className =
    "name-display text-2xl font-bold-jst text-jst-blue uppercase min-h-[3rem] flex items-center";

  const btn = document.createElement("button");
  btn.className =
    "mt-2 text-[9px] font-bold text-slate-300 hover:text-jst-red self-end uppercase";
  btn.innerText = "Re-sortear ID";
  btn.onclick = () => reSorteoIndividual(item, slot.card);

  slot.card.appendChild(btn);
}

// =======================
// RE-SORTEO CON SHUFFLE
// =======================
function reSorteoIndividual(item, card) {
  disponibles.push(item.regalo);
  historial = historial.filter((h) => h !== item);
  card.remove();

  const regalo = disponibles.splice(disponibles.indexOf(item.regalo), 1)[0];

  const slot = {
    regalo,
    card: crearCard(regalo, "RE-RIFANDO..."),
  };

  ganadoresActualesEl.appendChild(slot.card);

  animarShuffle([slot], () => {
    if (regalo.id === "39") {
      veces39Rifado++;

      if (veces39Rifado === 2) slot.ganador = ANGEL;
      else slot.ganador = sacarElegible();
    } else {
      slot.ganador = sacarElegible();
    }

    finalizarSlot(slot);
    actualizarStats();
    actualizarHistorialUI();
  });
}

// =======================
// HISTORIAL
// =======================
function actualizarHistorialUI() {
  historialEl.innerHTML = historial
    .map(
      (h) => `
      <div class="bg-slate-50 p-3 rounded-2xl border shadow-sm">
        <span class="font-bold-jst text-jst-red text-lg">#${h.regalo.id}</span>
        <span class="text-[10px] font-bold uppercase">${h.ganador}</span>
      </div>
    `
    )
    .reverse()
    .join("");
}

document.addEventListener("DOMContentLoaded", init);
