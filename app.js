/* ==========================================================================
   NEXORA LAB - NÚCLEO DE EXPERIMENTACIÓN E IA HÍBRIDA
   ========================================================================== */

// Estado Global
let nivelActual = "";
let temaSeleccionado = null;
let pasoActual = 1;
let animFrameId = null;
let registrosExperimentales = [];
let acelerometroHabilitado = false;
let sensorAccelX = 0;

// Base de Datos de Experimentos Interactivos
const catalogoExperimentos = {
    Secundaria: {
        Fisica: [
            {
                id: "sec-fis-1",
                nombre: "2ª Ley de Newton: Fuerza, Masa y Aceleración",
                disciplina: "Física Mecánica",
                desc: "Analiza cómo la masa del objeto y la fuerza motriz definen la aceleración de un vehículo sobre una superficie con fricción.",
                simTipo: "newton"
            },
            {
                id: "sec-fis-2",
                nombre: "Tiro Parabólico y Alcance de Proyectiles",
                disciplina: "Cinemática",
                desc: "Descubre la relación angular y de velocidad inicial sobre la distancia de impacto.",
                simTipo: "parabolico"
            }
        ],
        Quimica: [
            {
                id: "sec-qui-1",
                nombre: "Escala de pH y Neutralización Ácido-Base",
                disciplina: "Química Inorgánica",
                desc: "Experimenta agregando ácidos o bases a soluciones para observar el cambio de concentración [H+] y colorimetría.",
                simTipo: "ph"
            }
        ],
        Biologia: [
            {
                id: "sec-bio-1",
                nombre: "Ósmosis y Transporte en Membranas Semipermeables",
                disciplina: "Biología Celular",
                desc: "Modifica la concentración de solutos para visualizar la turgencia o plasmólisis celular bajo el microscopio virtual.",
                simTipo: "osmosis"
            }
        ]
    },
    Preparatoria: {
        Fisica: [
            {
                id: "prep-fis-1",
                nombre: "Dinámica Vectorial y Coeficiente de Rozamiento Dinámico",
                disciplina: "Física Cuantitativa",
                desc: "Mide el tiempo de desaceleración y deduce el coeficiente de fricción cinético en planos con diferentes rugosidades.",
                simTipo: "newton"
            }
        ],
        Quimica: [
            {
                id: "prep-qui-1",
                nombre: "Equilibrio Químico y Titulación Ácido Fuerte",
                disciplina: "Termodinámica Química",
                desc: "Calcula el volumen de viraje y la variación de pH al titular un ácido con hidróxido de sodio.",
                simTipo: "ph"
            }
        ],
        Biologia: [
            {
                id: "prep-bio-1",
                nombre: "Cinética de Membrana y Presión Osmótica de Van 't Hoff",
                disciplina: "Fisiología Celular",
                desc: "Analiza el flujo volumétrico a través de acuaporinas artificiales ante gradientes de sacarosa.",
                simTipo: "osmosis"
            }
        ]
    }
};

/* ==========================================================================
   GESTIÓN DE RED Y CONECTIVIDAD HÍBRIDA
   ========================================================================== */
window.addEventListener('online', actualizarIndicadorRed);
window.addEventListener('offline', actualizarIndicadorRed);

function actualizarIndicadorRed() {
    const badge = document.getElementById("estado-red");
    if (navigator.onLine) {
        badge.innerText = "Modo Conectado (IA Global Habilitada)";
        badge.className = "badge online";
    } else {
        badge.innerText = "Modo Sin Conexión (IA Local Activa)";
        badge.className = "badge offline";
    }
}

// Almacenamiento local de API Key (opcional para el aula o alumno)
function guardarApiKey() {
    const key = document.getElementById("input-api-key").value.trim();
    if (key) {
        localStorage.setItem("nexora_gemini_key", key);
        alert("Clave guardada con éxito en el dispositivo.");
    } else {
        localStorage.removeItem("nexora_gemini_key");
        alert("Clave eliminada. Se usará el motor local.");
    }
    toggleModalConfig();
}

function toggleModalConfig() {
    const modal = document.getElementById("modal-config");
    modal.classList.toggle("hidden");
    const guardada = localStorage.getItem("nexora_gemini_key") || "";
    document.getElementById("input-api-key").value = guardada;
}

/* ==========================================================================
   NAVEGACIÓN Y MENÚS
   ========================================================================== */
function seleccionarNivel(nivel) {
    nivelActual = nivel;
    document.getElementById("menu-niveles").classList.add("hidden");
    document.getElementById("titulo-nivel").innerText = `Nivel: ${nivel}`;
    document.getElementById("menu-materias").classList.remove("hidden");
    document.getElementById("select-materia").value = "";
    document.getElementById("select-tema").innerHTML = '<option value="">-- Primero elige una materia --</option>';
    document.getElementById("tema-info-card").classList.add("hidden");
}

function volverMenuNiveles() {
    document.getElementById("menu-materias").classList.add("hidden");
    document.getElementById("menu-niveles").classList.remove("hidden");
}

function cargarTemasMateria() {
    const materia = document.getElementById("select-materia").value;
    const selectTema = document.getElementById("select-tema");
    const infoCard = document.getElementById("tema-info-card");
    selectTema.innerHTML = "";
    infoCard.classList.add("hidden");

    if (!materia) {
        selectTema.innerHTML = '<option value="">-- Primero elige una materia --</option>';
        return;
    }

    const temas = catalogoExperimentos[nivelActual][materia] || [];
    let optDefault = document.createElement("option");
    optDefault.value = "";
    optDefault.textContent = "-- Selecciona el experimento --";
    selectTema.appendChild(optDefault);

    temas.forEach(t => {
        let opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = t.nombre;
        selectTema.appendChild(opt);
    });
}

function actualizarInfoTema() {
    const materia = document.getElementById("select-materia").value;
    const temaId = document.getElementById("select-tema").value;
    const infoCard = document.getElementById("tema-info-card");

    if (!temaId) {
        infoCard.classList.add("hidden");
        return;
    }

    temaSeleccionado = catalogoExperimentos[nivelActual][materia].find(t => t.id === temaId);
    document.getElementById("tema-preview-desc").innerText = temaSeleccionado.desc;
    infoCard.classList.remove("hidden");
}

function volverAMaterias() {
    detenerSimulacion();
    document.getElementById("vista-laboratorio").classList.add("hidden");
    document.getElementById("menu-materias").classList.remove("hidden");
}

/* ==========================================================================
   INICIALIZACIÓN DEL LABORATORIO EXPERIMENTAL
   ========================================================================== */
function iniciarLaboratorio() {
    if (!temaSeleccionado) return;

    // Reset de datos
    registrosExperimentales = [];
    limpiarCampos();

    document.getElementById("lab-titulo-tema").innerText = temaSeleccionado.nombre;
    document.getElementById("lab-materia-tag").innerText = temaSeleccionado.disciplina;
    document.getElementById("obs-texto").innerText = temaSeleccionado.desc;

    document.getElementById("menu-materias").classList.add("hidden");
    document.getElementById("vista-laboratorio").classList.remove("hidden");

    configurarControlesSimulacion(temaSeleccionado.simTipo);
    iniciarSimulacionCanvas("canvas-obs", temaSeleccionado.simTipo, true);
    cambiarPaso(1);
    
    verificarSoporteSensores();
}

function limpiarCampos() {
    document.getElementById("input-observacion").value = "";
    document.getElementById("input-problema").value = "";
    document.getElementById("input-hipotesis").value = "";
    document.getElementById("input-analisis").value = "";
    document.getElementById("input-conclusion").value = "";
    document.getElementById("input-comunicacion").value = "";
    document.getElementById("tabla-cuerpo").innerHTML = `<tr><td colspan="4" style="text-align:center;">Ejecuta experimentos en el paso 4 para poblar la tabla.</td></tr>`;
}

function cambiarPaso(paso) {
    pasoActual = paso;
    document.querySelectorAll(".step-pane").forEach(p => p.classList.add("hidden"));
    
    const panel = document.querySelector(`.step-pane[data-paso="${paso}"]`);
    if (panel) panel.classList.remove("hidden");

    const nombresPasos = [
        "Observación", "Planteamiento del Problema", "Formulación de Hipótesis",
        "Experimentación", "Análisis de Datos", "Conclusión", "Comunicación"
    ];

    document.getElementById("paso-indicador").innerText = `Paso ${paso} de 7: ${nombresPasos[paso - 1]}`;
    document.getElementById("progress-bar").style.width = `${(paso / 7) * 100}%`;

    detenerSimulacion();

    // Activar canvas correspondiente al paso
    if (paso === 1) {
        iniciarSimulacionCanvas("canvas-obs", temaSeleccionado.simTipo, true);
    } else if (paso === 4) {
        iniciarSimulacionCanvas("canvas-exp", temaSeleccionado.simTipo, false);
    } else if (paso === 6) {
        // Recordatorio de la hipótesis en la conclusión
        const hip = document.getElementById("input-hipotesis").value.trim() || "(No formulaste ninguna hipótesis)";
        document.getElementById("recordatorio-hipotesis").innerHTML = `<b>Tu hipótesis inicial:</b> <i>"${hip}"</i>`;
    }
}

// Validación previa a continuar para motivar el rigor científico
function validarYPasar(pasoOrigen, pasoDestino) {
    let campo = null;
    let msgError = "";

    if (pasoOrigen === 1) {
        campo = document.getElementById("input-observacion").value.trim();
        msgError = "Por favor registra al menos una observación detallada del fenómeno antes de avanzar.";
    } else if (pasoOrigen === 2) {
        campo = document.getElementById("input-problema").value.trim();
        msgError = "Escribe una pregunta de investigación formal para definir el problema.";
    } else if (pasoOrigen === 3) {
        campo = document.getElementById("input-hipotesis").value.trim();
        msgError = "Formula una hipótesis tentativa comprobable antes de pasar al simulador.";
    } else if (pasoOrigen === 5) {
        campo = document.getElementById("input-analisis").value.trim();
        msgError = "Ingresa tu interpretación y análisis de los datos experimentales obtenidos.";
    } else if (pasoOrigen === 6) {
        campo = document.getElementById("input-conclusion").value.trim();
        msgError = "Argumenta si tu hipótesis fue refutada o aceptada en tus conclusiones.";
    }

    if (campo !== null && campo.length < 8) {
        alert(msgError);
        return;
    }
    cambiarPaso(pasoDestino);
}

/* ==========================================================================
   SIMULACIONES EN CANVAS 2D (LIGERAS, 60 FPS, DISPOSITIVOS ACCESIBLES)
   ========================================================================== */

// Estado del simulador físico
let simState = {
    x: 30,
    vx: 0,
    fuerza: 20,
    masa: 2.0,
    friccion: 0.15,
    phActual: 7.0,
    gotasAcido: 0,
    gotasBase: 0,
    concentracionSoluto: 1.0,
    celulas: []
};

function configurarControlesSimulacion(tipo) {
    const panel = document.getElementById("sim-controles");
    panel.innerHTML = "";

    if (tipo === "newton") {
        panel.innerHTML = `
            <div class="control-item">
                <div class="control-header"><span>Fuerza Aplicada: <b id="val-fuerza">20</b> N</span></div>
                <input type="range" class="slider" id="sl-fuerza" min="5" max="80" value="20" oninput="ajustarVarNewton()">
            </div>
            <div class="control-item">
                <div class="control-header"><span>Masa del Carro: <b id="val-masa">2.0</b> kg</span></div>
                <input type="range" class="slider" id="sl-masa" min="0.5" max="5.0" step="0.5" value="2.0" oninput="ajustarVarNewton()">
            </div>
            <button class="btn success sm" style="margin-top:8px;" onclick="lanzarPruebaNewton()">▶ Aplicar Impulso y Medir</button>
        `;
    } else if (tipo === "ph") {
        panel.innerHTML = `
            <div class="button-group">
                <button class="btn secondary sm" onclick="agregarReactivo('acido')">+ 1 mL Ácido Clorhídrico (HCl)</button>
                <button class="btn secondary sm" onclick="agregarReactivo('base')">+ 1 mL Hidróxido de Sodio (NaOH)</button>
                <button class="btn sm" onclick="resetearPH()">🔄 Neutralizar</button>
            </div>
            <div style="margin-top:10px; font-size:0.85rem; text-align:center;">
                pH medido: <b id="val-ph" style="font-size:1.1rem; color:#60a5fa;">7.00</b> (Neutro)
            </div>
        `;
    } else if (tipo === "osmosis") {
        panel.innerHTML = `
            <div class="control-item">
                <div class="control-header"><span>Concentración Salina Externa: <b id="val-osm">1.0</b> Molar</span></div>
                <input type="range" class="slider" id="sl-osm" min="0.1" max="3.0" step="0.1" value="1.0" oninput="ajustarOsmosis()">
            </div>
            <div style="font-size:0.8rem; color:#9bb0c5; text-align:center;">
                Medio: <span id="estado-osmosis">Isotónico (Equilibrio)</span>
            </div>
            <button class="btn success sm" style="margin-top:8px;" onclick="registrarDatoOsmosis()">Registrar Estado Celular</button>
        `;
    } else {
        // Tiro parabólico
        panel.innerHTML = `
            <div class="control-item">
                <div class="control-header"><span>Ángulo de Disparo: <b id="val-ang">45</b>°</span></div>
                <input type="range" class="slider" id="sl-ang" min="15" max="80" value="45" oninput="document.getElementById('val-ang').innerText = this.value">
            </div>
            <button class="btn success sm" onclick="dispararProyectil()">🎯 Disparar y Medir Alcance</button>
        `;
    }
}

function detenerSimulacion() {
    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }
}

function iniciarSimulacionCanvas(canvasId, tipo, esDemoObservacion) {
    detenerSimulacion();
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Reiniciar posición
    simState.x = 40;
    simState.vx = 0;

    // Inicializar células para osmosis si aplica
    if (tipo === "osmosis") {
        simState.celulas = [];
        for (let i = 0; i < 15; i++) {
            simState.celulas.push({
                x: 80 + Math.random() * 400,
                y: 50 + Math.random() * 160,
                radioBase: 16,
                radio: 16
            });
        }
    }

    let t = 0;

    function bucle() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        t += 0.03;

        if (tipo === "newton") {
            dibujarSimulacionNewton(ctx, canvas, esDemoObservacion, t);
        } else if (tipo === "ph") {
            dibujarSimulacionPH(ctx, canvas, t);
        } else if (tipo === "osmosis") {
            dibujarSimulacionOsmosis(ctx, canvas, t);
        } else {
            dibujarSimulacionParabolico(ctx, canvas, t);
        }

        animFrameId = requestAnimationFrame(bucle);
    }
    bucle();
}

// Simulador Física: Carro en movimiento
function dibujarSimulacionNewton(ctx, canvas, esDemo, t) {
    const sueloY = canvas.height - 40;

    // Dibujar suelo y regla métrica
    ctx.strokeStyle = "#2a3b4e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, sueloY);
    ctx.lineTo(canvas.width, sueloY);
    ctx.stroke();

    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, sueloY);
        ctx.lineTo(x, sueloY + 8);
        ctx.stroke();
    }

    // Actualización de física si está en movimiento
    if (!esDemo) {
        simState.x += simState.vx;
        simState.vx *= (1 - simState.friccion * 0.1); // amortiguamiento
        if (simState.x > canvas.width - 70) {
            simState.x = canvas.width - 70;
            simState.vx = 0;
        }
    } else {
        // En observación oscila automáticamente para que observen el fenómeno
        simState.x = 80 + Math.sin(t) * 50;
    }

    // Carro
    const carroW = 55;
    const carroH = 26;
    const carroY = sueloY - carroH - 8;

    ctx.fillStyle = "#3a82ee";
    ctx.fillRect(simState.x, carroY, carroW, carroH);

    // Ruedas
    ctx.fillStyle = "#94a3b8";
    ctx.beginPath();
    ctx.arc(simState.x + 12, sueloY - 4, 6, 0, Math.PI * 2);
    ctx.arc(simState.x + carroW - 12, sueloY - 4, 6, 0, Math.PI * 2);
    ctx.fill();

    // Vector de aceleración
    if (simState.vx > 0.05) {
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(simState.x + carroW, carroY + carroH / 2);
        ctx.lineTo(simState.x + carroW + (simState.vx * 15), carroY + carroH / 2);
        ctx.stroke();
    }

    // Sensores de teléfono aplicados
    if (acelerometroHabilitado && Math.abs(sensorAccelX) > 0.5) {
        simState.x += sensorAccelX * 0.5;
    }
}

function ajustarVarNewton() {
    simState.fuerza = parseFloat(document.getElementById("sl-fuerza").value);
    simState.masa = parseFloat(document.getElementById("sl-masa").value);
    document.getElementById("val-fuerza").innerText = simState.fuerza;
    document.getElementById("val-masa").innerText = simState.masa.toFixed(1);
}

function lanzarPruebaNewton() {
    const acel = (simState.fuerza / simState.masa);
    simState.x = 40;
    simState.vx = Math.min(acel * 0.5, 12);

    // Registro de ensayo en la tabla
    const entrada = `F = ${simState.fuerza} N, m = ${simState.masa} kg`;
    const salida = `Aceleración calculada = ${acel.toFixed(2)} m/s²`;
    agregarFilaTabla(entrada, salida, "Completado con éxito");
}

// Simulador Química: Colorimetría de pH
function dibujarSimulacionPH(ctx, canvas, t) {
    const cx = canvas.width / 2;
    const vasoW = 120;
    const vasoH = 150;
    const vasoY = 60;

    // Gradiente de color según pH (1 rojo ácido, 7 verde neutro, 14 violeta base)
    let colorLiquido = obtenerColorPH(simState.phActual);

    // Líquido
    ctx.fillStyle = colorLiquido;
    ctx.fillRect(cx - vasoW / 2 + 6, vasoY + 30 + Math.sin(t * 2) * 2, vasoW - 12, vasoH - 36);

    // Silueta de Vaso Precipitado
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 3;
    ctx.strokeRect(cx - vasoW / 2, vasoY, vasoW, vasoH);

    // Medidor digital
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(cx - 50, 15, 100, 30);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`pH: ${simState.phActual.toFixed(2)}`, cx, 35);
}

function obtenerColorPH(ph) {
    if (ph < 4) return "rgba(239, 68, 68, 0.7)";     // Rojo fuerte
    if (ph < 6) return "rgba(249, 115, 22, 0.7)";    // Naranja
    if (ph <= 8) return "rgba(34, 197, 94, 0.7)";    // Verde neutro
    if (ph < 11) return "rgba(59, 130, 246, 0.7)";   // Azul
    return "rgba(147, 51, 234, 0.7)";                 // Violeta alcalino
}

function agregarReactivo(tipo) {
    if (tipo === "acido") {
        simState.phActual = Math.max(1.0, simState.phActual - 1.25);
        simState.gotasAcido++;
    } else {
        simState.phActual = Math.min(14.0, simState.phActual + 1.25);
        simState.gotasBase++;
    }
    const valPh = document.getElementById("val-ph");
    if (valPh) valPh.innerText = simState.phActual.toFixed(2);

    agregarFilaTabla(
        tipo === 'acido' ? `+1 mL HCl (Total: ${simState.gotasAcido})` : `+1 mL NaOH (Total: ${simState.gotasBase})`,
        `pH = ${simState.phActual.toFixed(2)}`,
        simState.phActual < 7 ? "Acidificación" : simState.phActual > 7 ? "Basificación" : "Neutralidad"
    );
}

function resetearPH() {
    simState.phActual = 7.0;
    simState.gotasAcido = 0;
    simState.gotasBase = 0;
    const valPh = document.getElementById("val-ph");
    if (valPh) valPh.innerText = "7.00";
}

// Simulador Biología: Ósmosis y turgencia
function dibujarSimulacionOsmosis(ctx, canvas, t) {
    // Fondo de medio acuoso
    ctx.fillStyle = "#0c1f2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const conc = simState.concentracionSoluto;
    // Factor de turgencia: en baja concentración de soluto externo (hipotónico), la célula se hincha
    const factorRadio = conc < 1.0 ? 1.4 : conc > 1.0 ? 0.65 : 1.0;

    simState.celulas.forEach((cel, i) => {
        let r = cel.radioBase * factorRadio + Math.sin(t + i) * 0.8;
        ctx.fillStyle = conc > 1.0 ? "#ca8a04" : "#10b981";
        ctx.beginPath();
        ctx.arc(cel.x, cel.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo celular
        ctx.fillStyle = "#064e3b";
        ctx.beginPath();
        ctx.arc(cel.x - 2, cel.y - 2, r * 0.3, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Solución externa: ${conc.toFixed(1)} M`, 15, 25);
}

function ajustarOsmosis() {
    const sl = parseFloat(document.getElementById("sl-osm").value);
    simState.concentracionSoluto = sl;
    document.getElementById("val-osm").innerText = sl.toFixed(1);

    const txtEstado = document.getElementById("estado-osmosis");
    if (sl < 0.8) {
        txtEstado.innerText = "Hipotónico (Células turgentes / hinchadas)";
    } else if (sl > 1.2) {
        txtEstado.innerText = "Hipertónico (Plasmólisis / Células deshidratadas)";
    } else {
        txtEstado.innerText = "Isotónico (Equilibrio osmótico normal)";
    }
}

function registrarDatoOsmosis() {
    const estado = document.getElementById("estado-osmosis").innerText;
    agregarFilaTabla(
        `Concentración: ${simState.concentracionSoluto.toFixed(1)} M`,
        estado.split("(")[0].trim(),
        "Morfología celular registrada"
    );
}

// Simulador Cinemática: Tiro Parabólico
let trayectProyectil = [];
function dibujarSimulacionParabolico(ctx, canvas) {
    ctx.strokeStyle = "#475569";
    ctx.beginPath();
    ctx.moveTo(20, canvas.height - 20);
    ctx.lineTo(canvas.width, canvas.height - 20);
    ctx.stroke();

    // Cañón
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(30, canvas.height - 20, 14, 0, Math.PI * 2);
    ctx.fill();

    // Dibujar trayectoria
    if (trayectProyectil.length > 1) {
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(trayectProyectil[0].x, trayectProyectil[0].y);
        for (let pt of trayectProyectil) {
            ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
    }
}

function dispararProyectil() {
    const ang = parseFloat(document.getElementById("sl-ang").value);
    const rad = (ang * Math.PI) / 180;
    const v0 = 50; // m/s virtual
    const g = 9.8;
    const alcance = (Math.pow(v0, 2) * Math.sin(2 * rad)) / g;

    trayectProyectil = [];
    const canvas = document.getElementById("canvas-exp");
    const h = canvas ? canvas.height - 20 : 200;

    for (let t = 0; t <= (2 * v0 * Math.sin(rad)) / g; t += 0.1) {
        let px = 30 + (v0 * Math.cos(rad) * t) * 0.7;
        let py = h - (v0 * Math.sin(rad) * t - 0.5 * g * t * t) * 0.7;
        trayectProyectil.push({ x: px, y: py });
    }

    agregarFilaTabla(`Ángulo: ${ang}° (V0: 50 m/s)`, `Alcance X = ${alcance.toFixed(1)} m`, "Impacto en tierra");
}

/* ==========================================================================
   TABLA DE DATOS EXPERIMENTALES
   ========================================================================== */
function agregarFilaTabla(variableX, variableY, nota) {
    const tabla = document.getElementById("tabla-cuerpo");
    if (registrosExperimentales.length === 0) {
        tabla.innerHTML = "";
    }

    const n = registrosExperimentales.length + 1;
    registrosExperimentales.push({ n, variableX, variableY, nota });

    const fila = document.createElement("tr");
    fila.innerHTML = `
        <td><b>#${n}</b></td>
        <td>${variableX}</td>
        <td>${variableY}</td>
        <td><span class="tag">${nota}</span></td>
    `;
    tabla.appendChild(fila);
}

/* ==========================================================================
   SENSORES HARDWARE ACCESIBLES (ACELERÓMETRO)
   ========================================================================== */
function verificarSoporteSensores() {
    if (window.DeviceMotionEvent) {
        document.getElementById("sensor-activador-box").classList.remove("hidden");
    }
}

function solicitarPermisoSensores() {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then(res => {
                if (res === 'granted') activarEscuchaSensores();
            })
            .catch(console.error);
    } else {
        activarEscuchaSensores();
    }
}

function activarEscuchaSensores() {
    window.addEventListener('devicemotion', (evt) => {
        if (evt.accelerationIncludingGravity) {
            sensorAccelX = evt.accelerationIncludingGravity.x || 0;
            acelerometroHabilitado = true;
            const badge = document.getElementById("sensor-badge");
            badge.innerText = "Acelerómetro Físico: Activo";
            badge.className = "badge sensor-on";
        }
    });
}

/* ==========================================================================
   IA HÍBRIDA REAL (LOCAL + GLOBAL CLOUD)
   ========================================================================== */

// Rúbrica Heurística y Procesamiento de Lenguaje Natural Local
function evaluarConIALocal(datosEstudiante) {
    let puntaje = 0;
    let feedback = [];

    // 1. Evaluación de Observación
    const obs = datosEstudiante.observacion.toLowerCase();
    if (obs.length > 25) {
        puntaje += 15;
        feedback.push({ paso: "Observación", ok: true, nota: "Detallada y descriptiva. Registra cambios cuantitativos y cualitativos." });
    } else {
        feedback.push({ paso: "Observación", ok: false, nota: "Muy breve. Describe con más detalle variables como el tiempo, la posición o los cambios de estado." });
    }

    // 2. Planteamiento del Problema (búsqueda de estructura interrogativa y variables)
    const prob = datosEstudiante.problema.toLowerCase();
    const esPregunta = prob.includes("?") || prob.includes("¿") || prob.includes("cómo") || prob.includes("de qué manera");
    if (esPregunta && prob.length > 15) {
        puntaje += 15;
        feedback.push({ paso: "Problema", ok: true, nota: "Pregunta investigable correctamente articulada." });
    } else {
        feedback.push({ paso: "Problema", ok: false, nota: "No parece una pregunta causal. Usa fórmulas como: '¿Cómo afecta X a Y?'" });
    }

    // 3. Evaluación de Hipótesis (Causalidad: "Si... entonces...")
    const hip = datosEstudiante.hipotesis.toLowerCase();
    const tieneCausalidad = (hip.includes("si ") || hip.includes("si aumentamos") || hip.includes("al ")) && 
                            (hip.includes("entonces") || hip.includes("aumentará") || hip.includes("disminuirá") || hip.includes("provocará"));
    if (tieneCausalidad) {
        puntaje += 20;
        feedback.push({ paso: "Hipótesis", ok: true, nota: "Excelente formulación predictiva con condición y efecto esperado." });
    } else {
        feedback.push({ paso: "Hipótesis", ok: false, nota: "La hipótesis debe ser una predicción comprobable condicional ('Si... entonces...')." });
    }

    // 4. Experimentación empírica
    if (registrosExperimentales.length >= 2) {
        puntaje += 15;
        feedback.push({ paso: "Experimentación", ok: true, nota: `Rigor empírico adecuado con ${registrosExperimentales.length} repeticiones/ensayos.` });
    } else {
        feedback.push({ paso: "Experimentación", ok: false, nota: "Se recomienda realizar al menos 2 ensayos controlados para contrastar mediciones." });
    }

    // 5. Análisis de datos
    const ana = datosEstudiante.analisis.toLowerCase();
    if (ana.length > 20 && (ana.includes("relación") || ana.includes("proporcional") || ana.includes("aumenta") || ana.includes("disminuye") || ana.includes("mayor") || ana.includes("menor"))) {
        puntaje += 15;
        feedback.push({ paso: "Análisis de Datos", ok: true, nota: "Identifica correctamente correlaciones y tendencias en los datos." });
    } else {
        feedback.push({ paso: "Análisis de Datos", ok: false, nota: "Intenta relacionar los números de la tabla: ¿qué ocurre con Y cuando X se duplica?" });
    }

    // 6. Conclusión y Verificación
    const conc = datosEstudiante.conclusion.toLowerCase();
    const validaHip = conc.includes("valida") || conc.includes("refuta") || conc.includes("comprueba") || conc.includes("hipótesis");
    if (validaHip) {
        puntaje += 20;
        feedback.push({ paso: "Conclusión", ok: true, nota: "Contrasta de manera rigurosa la validez de la hipótesis con base en las pruebas." });
    } else {
        feedback.push({ paso: "Conclusión", ok: false, nota: "Recuerda declarar explícitamente si tu hipótesis inicial fue confirmada o refutada." });
    }

    return {
        puntaje,
        motor: "IA Local Heurística (Offline)",
        detalles: feedback,
        resumen: puntaje >= 75 
            ? "El procedimiento científico cumple con los estándares experimentales de rigor metodológico."
            : "Se identificaron áreas de mejora en la formulación de hipótesis o en el análisis cuantitativo."
    };
}

// Evaluación Global Cloud (API Gemini si hay conectividad y clave)
async function evaluarConIAGlobal(apiKey, datosEstudiante) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
Actúa como un profesor y científico riguroso de secundaria/preparatoria evaluando el método científico de un alumno.
Experimento: ${temaSeleccionado.nombre} (${nivelActual}).
Ensayos en tabla: ${JSON.stringify(registrosExperimentales)}.
Respuestas del estudiante:
- Observación: "${datosEstudiante.observacion}"
- Pregunta de Investigación: "${datosEstudiante.problema}"
- Hipótesis formulada: "${datosEstudiante.hipotesis}"
- Análisis de datos: "${datosEstudiante.analisis}"
- Conclusión: "${datosEstudiante.conclusion}"
- Comunicación: "${datosEstudiante.comunicacion}"

Devuelve ÚNICAMENTE un objeto JSON válido (sin backticks de markdown ni texto extra) con este esquema:
{
  "puntaje": [número del 1 al 100],
  "resumen": "[párrafo sintetizado con retroalimentación motivadora y rigurosa]",
  "detalles": [
    {"paso": "Observación", "ok": true/false, "nota": "[comentario breve]"},
    {"paso": "Problema", "ok": true/false, "nota": "[comentario breve]"},
    {"paso": "Hipótesis", "ok": true/false, "nota": "[comentario breve]"},
    {"paso": "Análisis", "ok": true/false, "nota": "[comentario breve]"},
    {"paso": "Conclusión", "ok": true/false, "nota": "[comentario breve]"}
  ]
}
`;

    const respuesta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });

    if (!respuesta.ok) throw new Error("Fallo en API Nube");

    const data = await respuesta.json();
    let rawText = data.candidates[0].content.parts[0].text.trim();
    // Limpieza de bloques de código markdown si los devuelve
    rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(rawText);
    parsed.motor = "IA Global Cloud (Google Gemini)";
    return parsed;
}

// Disparador Híbrido
async function ejecutarEvaluacionHibrida() {
    document.getElementById("vista-laboratorio").classList.add("hidden");
    document.getElementById("vista-evaluacion").classList.remove("hidden");
    
    const loading = document.getElementById("eval-loading");
    const container = document.getElementById("eval-resultado");
    const motorBadge = document.getElementById("eval-motor-badge");

    loading.classList.remove("hidden");
    container.innerHTML = "";

    const datosEstudiante = {
        observacion: document.getElementById("input-observacion").value.trim(),
        problema: document.getElementById("input-problema").value.trim(),
        hipotesis: document.getElementById("input-hipotesis").value.trim(),
        analisis: document.getElementById("input-analisis").value.trim(),
        conclusion: document.getElementById("input-conclusion").value.trim(),
        comunicacion: document.getElementById("input-comunicacion").value.trim()
    };

    const apiKey = localStorage.getItem("nexora_gemini_key");
    let resultado = null;

    // Conmutación automática: Si hay red + clave -> Nube. Si no -> IA Local
    if (navigator.onLine && apiKey) {
        try {
            motorBadge.innerText = "Consultando IA Global...";
            resultado = await evaluarConIAGlobal(apiKey, datosEstudiante);
        } catch (err) {
            console.warn("Fallo en IA Cloud. Degradando a IA Local...", err);
            resultado = evaluarConIALocal(datosEstudiante);
        }
    } else {
        resultado = evaluarConIALocal(datosEstudiante);
    }

    loading.classList.add("hidden");
    motorBadge.innerText = resultado.motor;

    // Renderizar dictamen
    let htmlPasos = "";
    resultado.detalles.forEach(d => {
        htmlPasos += `
            <div class="eval-card ${d.ok ? 'ok' : 'warn'}">
                <div style="font-weight:bold; font-size:0.9rem; margin-bottom:3px;">
                    ${d.ok ? '✔' : '⚠️'} ${d.paso}
                </div>
                <div style="font-size:0.83rem; color:#cbd5e1;">${d.nota}</div>
            </div>
        `;
    });

    container.innerHTML = `
        <div style="text-align:center; margin-bottom:15px;">
            <div class="eval-score">${resultado.puntaje} / 100</div>
            <p style="font-size:0.95rem; color:#e2e8f0;">${resultado.resumen}</p>
        </div>
        <div style="margin-top:15px;">
            <h4 style="font-size:0.9rem; color:var(--text-muted); margin-bottom:8px;">DESGLOSE POR PASO METODOLÓGICO:</h4>
            ${htmlPasos}
        </div>
    `;
}

function reintentarConPasoActual() {
    document.getElementById("vista-evaluacion").classList.add("hidden");
    document.getElementById("vista-laboratorio").classList.remove("hidden");
    cambiarPaso(6); // Regresar al análisis / conclusiones para ajustar
}

function reiniciarTodo() {
    detenerSimulacion();
    document.getElementById("vista-evaluacion").classList.add("hidden");
    document.getElementById("menu-niveles").classList.remove("hidden");
}

window.onload = () => {
    actualizarIndicadorRed();
};