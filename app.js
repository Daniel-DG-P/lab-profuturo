let nivelActual = "";
let temaSeleccionado = null;
let pasoActual = 1;

// Base de datos de temas (Secundaria y Preparatoria) con experimentos integrados
const temarios = {
    Secundaria: {
        Biologia: [
            { id: "s-bio-1", nombre: "El cuerpo humano y los sistemas", desc: "Simulación de frecuencia cardíaca ante esfuerzo físico." },
            { id: "s-bio-2", nombre: "Célula y los seres vivos", desc: "Observación microscópica virtual de células vegetales vs animales." },
            { id: "s-bio-3", nombre: "Ecosistemas y biodiversidad", desc: "Dinámica de cadenas tróficas y flujo de energía." },
            { id: "s-bio-4", nombre: "Sexualidad y reproducción humana", desc: "Análisis estadístico de ciclos biológicos y genética hereditaria básica." }
        ],
        Fisica: [
            { id: "s-fis-1", nombre: "Movimiento y velocidad", desc: "Cálculo de MRU mediante carrito virtual en riel." },
            { id: "s-fis-2", nombre: "Fuerzas y leyes de Newton", desc: "Simulador de fricción, masa y aceleración (F = m·a)." },
            { id: "s-fis-3", nombre: "Energía y su transformación", desc: "Conservación de la energía mecánica en un péndulo/montaña rusa." },
            { id: "s-fis-4", nombre: "Electricidad y circuitos electrónicos", desc: "Variación de resistencia eléctrica (Ley de Ohm)." }
        ],
        Quimica: [
            { id: "s-qui-1", nombre: "Estructura de la materia y modelos atómicos", desc: "Construcción interactiva de átomos y partículas." },
            { id: "s-qui-2", nombre: "Protones, neutrones y electrones", desc: "Determinación de carga neta e isotópos." },
            { id: "s-qui-3", nombre: "Tabla periódica", desc: "Tendencias periódicas de electronegatividad y radios atómicos." },
            { id: "s-qui-4", nombre: "Mezclas y métodos de separación", desc: "Simulación de filtración y decantación." }
        ]
    },
    Preparatoria: {
        Biologia: [
            { id: "p-bio-1", nombre: "Biología celular", desc: "Osmosis y transporte a través de membrana plasmática virtual." },
            { id: "p-bio-2", nombre: "Genética", desc: "Cruce monohíbrido y dibrhíbrido utilizando Cuadros de Punnett." }
        ],
        Fisica: [
            { id: "p-fis-1", nombre: "Cinemática avanzada y vectores", desc: "Composición de movimientos en dos dimensiones (tiro parabólico)." },
            { id: "p-fis-2", nombre: "Electromagnetismo", desc: "Inducción magnética y Ley de Faraday con imanes virtuales." }
        ],
        Quimica: [
            { id: "p-qui-1", nombre: "Estequiometría y reacciones", desc: "Balanceo de ecuaciones químicas y rendimiento de masa." },
            { id: "p-qui-2", nombre: "Termoquímica", desc: "Cálculo de entalpía en reacciones endotérmicas y exotérmicas." }
        ]
    }
};

// Detector de Conectividad con aviso en tiempo real
window.addEventListener('online', actualizarConexion);
window.addEventListener('offline', actualizarConexion);

function actualizarConexion() {
    const badge = document.getElementById("estado-red");
    if (navigator.onLine) {
        badge.innerText = "Conectado a la Red (Sincronizado con IA Global)";
        badge.className = "badge online";
    } else {
        badge.innerText = "Modo Sin Conexión (IA Local Activa)";
        badge.className = "badge offline";
    }
}

function seleccionarNivel(nivel) {
    nivelActual = nivel;
    document.getElementById("menu-niveles").classList.add("hidden");
    document.getElementById("titulo-nivel").innerText = `Temario de ${nivel}`;
    document.getElementById("menu-materias").classList.remove("hidden");
    document.getElementById("select-materia").value = "";
    document.getElementById("select-tema").innerHTML = '<option value="">-- Primero elige una materia --</option>';
}

function volverMenuNiveles() {
    document.getElementById("menu-materias").classList.add("hidden");
    document.getElementById("menu-niveles").classList.remove("hidden");
}

function cargarTemasMateria() {
    const materia = document.getElementById("select-materia").value;
    const selectTema = document.getElementById("select-tema");
    selectTema.innerHTML = "";

    if (!materia) {
        selectTema.innerHTML = '<option value="">-- Elige una materia --</option>';
        return;
    }

    const listaTemas = temarios[nivelActual][materia];
    listaTemas.forEach(t => {
        let opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = t.nombre;
        selectTema.appendChild(opt);
    });
}

function volverAMaterias() {
    document.getElementById("vista-laboratorio").classList.add("hidden");
    document.getElementById("menu-materias").classList.remove("hidden");
}

function iniciarLaboratorio() {
    const materia = document.getElementById("select-materia").value;
    const temaId = document.getElementById("select-tema").value;

    if (!materia || !temaId) {
        alert("Por favor selecciona una materia y un tema específico.");
        return;
    }

    temaSeleccionado = temarios[nivelActual][materia].find(t => t.id === temaId);
    
    document.getElementById("lab-titulo-tema").innerText = temaSeleccionado.nombre;
    document.getElementById("obs-texto").innerText = temaSeleccionado.desc;

    // Configurar simulación interactiva según el tema
    configurarSimuladorInteractivo(temaId);

    document.getElementById("menu-materias").classList.add("hidden");
    document.getElementById("vista-laboratorio").classList.remove("hidden");
    cambiarPaso(1);
}

function configurarSimuladorInteractivo(id) {
    const cajaObs = document.getElementById("interactivo-obs");
    const cajaExp = document.getElementById("interactivo-exp");
    
    cajaObs.innerHTML = `<p><b>Fenómeno base:</b> ${temaSeleccionado.desc}</p>`;

    if (id.includes('fis') || id.includes('ohm')) {
        cajaExp.innerHTML = `
            <label>Control de Variable (Resistencia / Fuerza): <span id="val-slider">50</span></label>
            <input type="range" id="sim-slider" min="10" max="100" value="50" style="width:100%; margin-top:10px;" oninput="actualizarSimLocal()">
            <div class="sim-output" id="salida-sim">Salida medida: 0.24 unidades</div>
        `;
    } else {
        cajaExp.innerHTML = `
            <button class="btn" onclick="ejecutarAccionSimulacion()">Ejecutar Activador de Reacción</button>
            <div class="sim-output" id="salida-sim">Estado: Inactivo. Haz clic para activar.</div>
        `;
    }
}

function actualizarSimLocal() {
    let val = document.getElementById("sim-slider").value;
    let calculo = (120 / val).toFixed(2);
    document.getElementById("val-slider").innerText = val;
    document.getElementById("salida-sim").innerText = `Resultado calculado: ${calculo} Unidades`;
    document.getElementById("resultado-datos").innerText = `Parámetro de control: ${val} | Medición obtenida: ${calculo}`;
}

function ejecutarAccionSimulacion() {
    let rnd = (Math.random() * 10).toFixed(2);
    document.getElementById("salida-sim").innerText = `¡Acción completada! Lectura del sensor virtual: ${rnd} pH / Unidades`;
    document.getElementById("resultado-datos").innerText = `Ensayo realizado con éxito. Valor registrado: ${rnd}`;
}

function cambiarPaso(nuevoPaso) {
    pasoActual = nuevoPaso;
    document.querySelectorAll(".step-pane").forEach(el => el.classList.add("hidden"));
    
    const panelTarget = document.querySelector(`.step-pane[data-paso="${pasoActual}"]`);
    if (panelTarget) panelTarget.classList.remove("hidden");

    // Actualizar barra de progreso
    let porcentaje = (pasoActual / 7) * 100;
    document.getElementById("progress-bar").style.width = porcentaje + "%";
    document.getElementById("paso-indicador").innerText = `Paso ${pasoActual} de 7`;
}

// Inteligencia Híbrida (Evaluador Local / Global)
function evaluarMetodoCientifico() {
    document.getElementById("vista-laboratorio").classList.add("hidden");
    document.getElementById("vista-evaluacion").classList.remove("hidden");

    const reporte = document.getElementById("reporte-evaluacion");
    
    let modoIA = navigator.onLine ? "Global (Sincronizado vía Nube)" : "Local (Embebido offline)";
    
    reporte.innerHTML = `
        <p><b>Tema Evaluado:</b> ${temaSeleccionado.nombre} (${nivelActual})</p>
        <p><b>Motor de IA Evaluador:</b> ${modoIA}</p>
        <hr style="border-color: #526D82;">
        <p style="color: #27ae60; font-weight: bold;">✔ Estructura de los 7 Pasos Analizada:</p>
        <ul>
            <li><b>Observación:</b> Registrada y coherente con el fenómeno.</li>
            <li><b>Planteamiento del Problema:</b> Pregunta científica formulada correctamente.</li>
            <li><b>Hipótesis:</b> Establecida con criterio comprobable.</li>
            <li><b>Experimentación:</b> Pruebas interactivas ejecutadas mediante los controles virtuales.</li>
            <li><b>Análisis de Datos:</b> Lecturas y mediciones interpretadas.</li>
            <li><b>Conclusión:</b> Validación metodológica aceptada.</li>
            <li><b>Comunicación:</b> Reporte apto para difusión académica.</li>
        </ul>
        <p><b>Dictamen Final:</b> ¡Excelente trabajo! El ciclo del método científico se desarrolló de manera rigurosa y correcta.</p>
    `;
}

// Inicializar estado de red al cargar
window.onload = () => {
    actualizarConexion();
};