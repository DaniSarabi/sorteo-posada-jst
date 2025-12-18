let participantes = [];
let regalos = [];
let elegibles = [];
let disponibles = [];
let historial = [];

const btnRifar5 = document.getElementById('btnRifar5');
const ganadoresActualesEl = document.getElementById('ganadoresActuales');
const historialEl = document.getElementById('historial');
const statElegibles = document.getElementById('stat-elegibles');
const statDisponibles = document.getElementById('stat-disponibles');

async function init() {
    try {
        const [resP, resR] = await Promise.all([
            fetch('participantes.json'),
            fetch('regalos.json')
        ]);
        participantes = await resP.json();
        regalos = await resR.json();
        
        elegibles = [...participantes];
        disponibles = [...regalos];
        
        actualizarStats();
        btnRifar5.disabled = false;
    } catch (e) {
        console.error("Error al cargar datos:", e);
    }
}

function actualizarStats() {
    statElegibles.innerText = elegibles.length;
    statDisponibles.innerText = disponibles.length;
}

btnRifar5.onclick = async () => {
    const numASortear = Math.min(5, elegibles.length, disponibles.length);
    if (numASortear === 0) return;

    btnRifar5.disabled = true;
    ganadoresActualesEl.innerHTML = '';
    
    const slots = [];
    for (let i = 0; i < numASortear; i++) {
        const rIdx = Math.floor(Math.random() * disponibles.length);
        const regalo = disponibles.splice(rIdx, 1)[0];
        
        const card = document.createElement('div');
        // Fusion de diseño: Borde redondeado grueso, fondo blanco, sombra sutil
        card.className = "bg-white border-b-8 border-jst-blue p-6 shadow-md h-70 h-max-90 flex flex-col justify-between winner-card";
        card.innerHTML = `
            <div class="text-jst-red font-bold-jst text-5xl leading-none">#${regalo.id}</div>
            <div class="name-display text-xl font-bold-jst text-slate-300 uppercase leading-tight min-h-[3rem] flex items-center">
                GIRANDO...
            </div>
            <div class="text-slate-400 text-[10px] font-bold uppercase italic border-t border-slate-100 pt-2">
                ${regalo.nombre}
            </div>
        `;
        ganadoresActualesEl.appendChild(card);
        slots.push({ card, regalo });
    }

    // Animación de Shuffle
    const duration = 4000;
    const startTime = Date.now();

    const interval = setInterval(() => {
        slots.forEach(slot => {
            const randomIdx = Math.floor(Math.random() * elegibles.length);
            slot.card.querySelector('.name-display').innerText = elegibles[randomIdx];
        });

        if (Date.now() - startTime >= duration) {
            clearInterval(interval);
            completarSorteo(slots);
        }
    }, 80);
};

function completarSorteo(slots) {
    slots.forEach(slot => {
        const pIdx = Math.floor(Math.random() * elegibles.length);
        const ganadorReal = elegibles.splice(pIdx, 1)[0];
        
        const item = { ganador: ganadorReal, regalo: slot.regalo };
        historial.push(item);

        const nameEl = slot.card.querySelector('.name-display');
        nameEl.innerText = ganadorReal;
        nameEl.className = "name-display text-2xl font-bold-jst text-jst-blue uppercase leading-tight min-h-[3rem] flex items-center";
        
        // Botón de No Asistió integrado sutilmente
        const btnNoAsistio = document.createElement('button');
        btnNoAsistio.className = "mt-2 text-[9px] font-bold text-slate-300 hover:text-jst-red transition-colors self-end uppercase";
        btnNoAsistio.innerText = "Re-sortear regalo";
        btnNoAsistio.onclick = () => reSorteoIndividual(item, slot.card);
        slot.card.appendChild(btnNoAsistio);
    });

    actualizarStats();
    actualizarHistorialUI();
    btnRifar5.disabled = false;
}

function reSorteoIndividual(item, card) {
    // Regresamos el ID del regalo
    disponibles.push(item.regalo);
    historial = historial.filter(h => h.ganador !== item.ganador);
    
    card.style.opacity = '0';
    card.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
        card.remove();
        // Rifamos inmediatamente el regalo recuperado
        const rIdx = disponibles.indexOf(item.regalo);
        const regaloRecuperado = disponibles.splice(rIdx, 1)[0];
        
        const newCard = document.createElement('div');
        newCard.className = "bg-white border-b-8 border-jst-red p-6 shadow-md h-56 flex flex-col justify-between winner-card";
        newCard.innerHTML = `
            <div class="text-jst-red font-bold-jst text-5xl leading-none">#${regaloRecuperado.id}</div>
            <div class="name-display text-xl font-bold-jst text-jst-blue uppercase leading-tight min-h-[3rem] flex items-center">
                NUEVO SORTEO...
            </div>
            <div class="text-slate-400 text-[10px] font-bold uppercase italic border-t border-slate-100 pt-2">
                ${regaloRecuperado.nombre}
            </div>
        `;
        ganadoresActualesEl.appendChild(newCard);
        
        // Shuffle rápido para el re-sorteo
        let t = 0;
        const subShuffle = setInterval(() => {
            newCard.querySelector('.name-display').innerText = elegibles[Math.floor(Math.random() * elegibles.length)];
            t++;
            if(t > 20) {
                clearInterval(subShuffle);
                const finalIdx = Math.floor(Math.random() * elegibles.length);
                const nuevoGanador = elegibles.splice(finalIdx, 1)[0];
                const nuevoItem = { ganador: nuevoGanador, regalo: regaloRecuperado };
                
                const finalNameEl = newCard.querySelector('.name-display');
                finalNameEl.innerText = nuevoGanador;
                finalNameEl.className = "name-display text-2xl font-bold-jst text-jst-blue uppercase leading-tight min-h-[3rem] flex items-center";
                
                historial.push(nuevoItem);
                actualizarStats();
                actualizarHistorialUI();

                const btn = document.createElement('button');
                btn.className = "mt-2 text-[9px] font-bold text-slate-300 hover:text-jst-red transition-colors self-end uppercase";
                btn.innerText = "Re-sortear ID";
                btn.onclick = () => reSorteoIndividual(nuevoItem, newCard);
                newCard.appendChild(btn);
            }
        }, 60);
    }, 300);
}

function actualizarHistorialUI() {
    historialEl.innerHTML = historial.map(h => `
        <div class="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col gap-1 shadow-sm">
            <span class="font-bold-jst text-jst-red text-lg leading-none">#${h.regalo.id}</span>
            <span class="text-[10px] font-bold text-slate-700 uppercase truncate">${h.ganador}</span>
        </div>
    `).reverse().join('');
}

document.addEventListener('DOMContentLoaded', init);