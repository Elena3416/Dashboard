
/* ==============================================
   DASHBOARD: USO DEL CELULAR EN LA NOCHE
   D3.js v7 + Observable Plot 0.6
   Histograma + Diagrama de cajas + 4 tarjetas
============================================== */

document.addEventListener("DOMContentLoaded", function () {

    // ==========================================
    // 1. CONFIGURACIÓN
    // ==========================================

    const archivoCSV = "./bedtime_screentime_sleep_bueno.csv";

    const ROJO = "#8a2323";
    const GRIS = "#999999";
    const AMARILLO = "#FFF3A3";
    const DORADO = "#FFD700";
    const OSCURO = "#312419";

    const ordenGrupos = [
        "Menos de 5",
        "5 a 6",
        "6 a 7",
        "7 a 8",
        "8 a 9",
        "9 o más"
    ];

    const contenedorHistograma =
        document.getElementById("grafica-histograma");

    const contenedorCajas =
        document.getElementById("grafica-cajas");

    if (!contenedorHistograma || !contenedorCajas) {
        console.error(
            "No se encontraron los contenedores de las gráficas."
        );
        return;
    }

    // ==========================================
    // 2. CARGAR LOS DATOS
    // ==========================================

    d3.csv(archivoCSV, d3.autoType)
        .then(function (datos) {

            let seleccionActual = null;

            let rectangulos = [];
            let puntos = [];

            let notaHistograma;
            let notaCaja;

            // ==================================
            // 3. FUNCIONES GENERALES
            // ==================================

            function obtenerGrupo(horas) {

                if (horas < 5) return "Menos de 5";
                if (horas < 6) return "5 a 6";
                if (horas < 7) return "6 a 7";
                if (horas < 8) return "7 a 8";
                if (horas < 9) return "8 a 9";

                return "9 o más";
            }

            function numeroValido(valor) {

                if (
                    valor === null ||
                    valor === undefined ||
                    valor === ""
                ) {
                    return NaN;
                }

                const numero = Number(valor);

                return Number.isFinite(numero)
                    ? numero
                    : NaN;
            }

            function promedio(registros, columna) {

                return d3.mean(
                    registros,
                    d => {
                        const valor = numeroValido(
                            d[columna]
                        );

                        return Number.isFinite(valor)
                            ? valor
                            : undefined;
                    }
                );
            }

            function formatear(valor, decimales, unidad) {

                if (!Number.isFinite(valor)) {
                    return "Sin datos";
                }

                return valor.toFixed(decimales) + unidad;
            }

            // ==================================
            // 4. LAS CUATRO TARJETAS
            // ==================================

            function escribirTarjeta(id, texto) {

                const elemento = document.querySelector(
                    `#${id} span`
                );

                if (elemento) {
                    elemento.textContent = texto;
                }
            }

            function reiniciarTarjetas() {

                escribirTarjeta("indicador1", "0 hr");
                escribirTarjeta("indicador2", "0 min");
                escribirTarjeta("indicador3", "0%");
                escribirTarjeta("indicador4", "0");
            }

            function actualizarTarjetas(registros) {

                if (registros.length === 0) {
                    reiniciarTarjetas();
                    return;
                }

                const horasSueno = promedio(
                    registros,
                    "total_sleep_hours"
                );

                const minutosCelular = promedio(
                    registros,
                    "bedtime_phone_minutes"
                );

                const filtroAzul = promedio(
                    registros,
                    "blue_light_filter_active"
                );

                const nivelFatiga = promedio(
                    registros,
                    "next_day_fatigue_score"
                );

                escribirTarjeta(
                    "indicador1",
                    formatear(horasSueno, 2, " hr")
                );

                escribirTarjeta(
                    "indicador2",
                    formatear(minutosCelular, 2, " min")
                );

                escribirTarjeta(
                    "indicador3",
                    formatear(filtroAzul * 100, 2, "%")
                );

                escribirTarjeta(
                    "indicador4",
                    formatear(nivelFatiga, 1, "")
                );
            }

            // Al abrir el dashboard:
            // las cuatro tarjetas muestran cero.
            reiniciarTarjetas();

            // ==================================
            // 5. CREAR POST-IT AMARILLOS
            // ==================================

            function crearPostIt(contenedor, mensaje) {

                const nota = document.createElement("div");

                nota.textContent = mensaje;

                Object.assign(nota.style, {

                    backgroundColor: AMARILLO,
                    color: "#403600",

                    padding: "12px 15px",

                    width: "520px",
                    maxWidth: "95%",

                    boxSizing: "border-box",

                    margin: "12px auto",

                    fontFamily: "Arial, sans-serif",
                    fontSize: "16px",
                    lineHeight: "1.5",

                    borderRadius: "4px",

                    boxShadow:
                        "2px 4px 8px rgba(0,0,0,0.18)"
                });

                contenedor.appendChild(nota);

                return nota;
            }

            function reiniciarNotas() {

                if (notaHistograma) {

                    notaHistograma.textContent =
                        "📌 Selecciona una barra del histograma.";
                }

                if (notaCaja) {

                    notaCaja.textContent =
                        "📌 Selecciona un punto amarillo del diagrama de cajas.";
                }
            }

            // ==================================
            // 6. DATOS DEL HISTOGRAMA
            // ==================================

            const horas = datos
                .map(d => numeroValido(
                    d.total_sleep_hours
                ))
                .filter(Number.isFinite);

            const intervalos = d3.bin()
                .domain([3, 10])
                .thresholds(
                    d3.range(3.5, 10, 0.5)
                )(horas);

            const barras = intervalos.map(
                (intervalo, indice) => ({

                    indice: indice,

                    inicio: intervalo.x0,
                    fin: intervalo.x1,

                    frecuencia: intervalo.length,

                    centro:
                        (intervalo.x0 + intervalo.x1) / 2,

                    color:
                        intervalo.x0 >= 6 &&
                        intervalo.x1 <= 7
                            ? ROJO
                            : GRIS
                })
            );

            // ==================================
            // 7. DIBUJAR HISTOGRAMA
            // ==================================

            const histograma = Plot.plot({

                width: Math.max(
                    420,
                    contenedorHistograma.clientWidth
                ),

                height: 330,

                marginTop: 40,
                marginLeft: 65,
                marginRight: 20,
                marginBottom: 55,

                x: {
                    label: "Horas de sueño",
                    domain: [3, 10],
                    nice: false,
                    labelArrow: "none"
                },

                y: {
                    label: "Frecuencia",
                    grid: true,
                    labelArrow: "none",
                    tickFormat: ",d"
                },

                color: {
                    type: "identity"
                },

                style: {
                    fontFamily: "Arial, sans-serif",
                    fontSize: 16
                },

                marks: [

                    Plot.rectY(barras, {

                        x1: "inicio",
                        x2: "fin",

                        y1: 0,
                        y2: "frecuencia",

                        fill: "color",

                        stroke: "white",
                        inset: 1
                    }),

                    Plot.text(barras, {

                        x: "centro",
                        y: "frecuencia",

                        text: "frecuencia",

                        dy: -10,

                        fill: "black",
                        fontSize: 16
                    }),

                    Plot.ruleY([0])
                ]
            });

            contenedorHistograma.replaceChildren(
                histograma
            );

            notaHistograma = crearPostIt(
                contenedorHistograma,
                "📌 Selecciona una barra del histograma."
            );

            // ==================================
            // 8. DATOS DEL DIAGRAMA DE CAJAS
            // ==================================

            const datosCajas = datos

                .filter(d => {

                    const horas = numeroValido(
                        d.total_sleep_hours
                    );

                    const fatiga = numeroValido(
                        d.next_day_fatigue_score
                    );

                    return Number.isFinite(horas) &&
                        Number.isFinite(fatiga);
                })

                .map(d => ({

                    grupo: obtenerGrupo(
                        numeroValido(
                            d.total_sleep_hours
                        )
                    ),

                    fatiga: numeroValido(
                        d.next_day_fatigue_score
                    )
                }));

            const grupos = d3.group(
                datosCajas,
                d => d.grupo
            );

            const estadisticas = ordenGrupos

                .filter(grupo => grupos.has(grupo))

                .map(grupo => {

                    const registros = grupos.get(
                        grupo
                    );

                    const fatigas = registros
                        .map(d => d.fatiga)
                        .sort(d3.ascending);

                    return {

                        grupo: grupo,

                        cantidad: fatigas.length,

                        mediana: d3.median(
                            fatigas
                        ),

                        q1: d3.quantile(
                            fatigas,
                            0.25
                        ),

                        q3: d3.quantile(
                            fatigas,
                            0.75
                        )
                    };
                });

            // ==================================
            // 9. DIBUJAR DIAGRAMA DE CAJAS
            // ==================================

            const cajas = Plot.plot({

                width: Math.max(
                    420,
                    contenedorCajas.clientWidth
                ),

                height: 330,

                marginTop: 40,
                marginLeft: 60,
                marginRight: 20,
                marginBottom: 80,

                x: {
                    label: "Horas de sueño",
                    domain: ordenGrupos,
                    tickRotate: -25,
                    labelArrow: "none"
                },

                y: {
                    label: "Nivel de fatiga",
                    grid: true,
                    labelArrow: "none"
                },

                style: {
                    fontFamily: "Arial, sans-serif",
                    fontSize: 16
                },

                marks: [

                    Plot.boxY(datosCajas, {

                        x: "grupo",
                        y: "fatiga",

                        fill: "#8a4c40",
                        stroke: OSCURO
                    }),

                    Plot.text(estadisticas, {

                        x: "grupo",
                        y: "mediana",

                        text: d =>
                            d.mediana.toFixed(1),

                        dy: -15,

                        fill: "#FFFFFF",

                        fontSize: 16,
                        fontWeight: "bold"
                    }),

                    Plot.dot(estadisticas, {

                        x: "grupo",
                        y: "mediana",

                        r: 7,

                        fill: DORADO,
                        stroke: OSCURO,

                        tip: true,

                        channels: {

                            "Registros": "cantidad"
                        }
                    })
                ]
            });

            contenedorCajas.replaceChildren(cajas);

            notaCaja = crearPostIt(
                contenedorCajas,
                "📌 Selecciona un punto amarillo del diagrama de cajas."
            );

            // ==================================
            // 10. ELEMENTOS INTERACTIVOS
            // ==================================

            rectangulos = Array.from(
                histograma.querySelectorAll(
                    'g[aria-label="rect"] rect'
                )
            );

            puntos = Array.from(
                cajas.querySelectorAll(
                    'g[aria-label="dot"] circle'
                )
            );

            // ==================================
            // 11. RESTAURAR RESALTADOS
            // ==================================

            function restaurarBarras() {

                rectangulos.forEach(rectangulo => {

                    rectangulo.setAttribute(
                        "stroke",
                        "white"
                    );

                    rectangulo.setAttribute(
                        "stroke-width",
                        "1"
                    );
                });
            }

            function restaurarPuntos() {

                puntos.forEach(punto => {

                    punto.setAttribute(
                        "stroke",
                        OSCURO
                    );

                    punto.setAttribute(
                        "stroke-width",
                        "1"
                    );
                });
            }

            // ==================================
            // 12. RELACIONAR LAS DOS GRÁFICAS
            // ==================================

            function relacionarGraficas() {

                restaurarBarras();
                restaurarPuntos();

                if (seleccionActual === null) {
                    return;
                }

                // ------------------------------
                // A. SELECCIÓN DEL HISTOGRAMA
                // ------------------------------

                if (
                    seleccionActual.tipo ===
                    "histograma"
                ) {

                    const indice =
                        seleccionActual.indice;

                    const barra = barras[indice];

                    if (!barra) return;

                    // Resaltar barra seleccionada
                    const rectangulo =
                        rectangulos[indice];

                    if (rectangulo) {

                        rectangulo.setAttribute(
                            "stroke",
                            "#222222"
                        );

                        rectangulo.setAttribute(
                            "stroke-width",
                            "3"
                        );
                    }

                    // Encontrar grupo de cajas
                    const grupoRelacionado =
                        obtenerGrupo(barra.centro);

                    const indiceGrupo =
                        estadisticas.findIndex(
                            d =>
                                d.grupo ===
                                grupoRelacionado
                        );

                    // Resaltar punto amarillo
                    if (
                        indiceGrupo !== -1 &&
                        puntos[indiceGrupo]
                    ) {

                        puntos[indiceGrupo]
                            .setAttribute(
                                "stroke",
                                ROJO
                            );

                        puntos[indiceGrupo]
                            .setAttribute(
                                "stroke-width",
                                "4"
                            );
                    }
                }

                // ------------------------------
                // B. SELECCIÓN DE LAS CAJAS
                // ------------------------------

                if (
                    seleccionActual.tipo === "caja"
                ) {

                    const grupoSeleccionado =
                        seleccionActual.grupo;

                    // Resaltar punto amarillo
                    const indiceGrupo =
                        estadisticas.findIndex(
                            d =>
                                d.grupo ===
                                grupoSeleccionado
                        );

                    if (
                        indiceGrupo !== -1 &&
                        puntos[indiceGrupo]
                    ) {

                        puntos[indiceGrupo]
                            .setAttribute(
                                "stroke",
                                ROJO
                            );

                        puntos[indiceGrupo]
                            .setAttribute(
                                "stroke-width",
                                "4"
                            );
                    }

                    // Resaltar barras relacionadas
                    barras.forEach((barra, i) => {

                        const grupoBarra =
                            obtenerGrupo(
                                barra.centro
                            );

                        if (
                            grupoBarra ===
                            grupoSeleccionado
                        ) {

                            const rectangulo =
                                rectangulos[i];

                            if (rectangulo) {

                                rectangulo.setAttribute(
                                    "stroke",
                                    ROJO
                                );

                                rectangulo.setAttribute(
                                    "stroke-width",
                                    "3"
                                );
                            }
                        }
                    });
                }
            }

            // ==================================
            // 13. SELECCIONAR O QUITAR FILTRO
            // ==================================

            function aplicarSeleccion(
                nuevaSeleccion,
                predicado
            ) {

                const mismaSeleccion =
                    seleccionActual !== null &&
                    seleccionActual.clave ===
                    nuevaSeleccion.clave;

                // Si se hace clic otra vez:
                // quitar la selección.
                if (mismaSeleccion) {

                    seleccionActual = null;

                    reiniciarTarjetas();
                    reiniciarNotas();

                    relacionarGraficas();

                    return false;
                }

                seleccionActual =
                    nuevaSeleccion;

                const filtrados = datos.filter(
                    predicado
                );

                actualizarTarjetas(filtrados);

                relacionarGraficas();

                return true;
            }

            // ==================================
            // 14. CLIC EN BARRAS DEL HISTOGRAMA
            // ==================================

            rectangulos.forEach(
                (rectangulo, indice) => {

                    rectangulo.style.cursor =
                        "pointer";

                    rectangulo.addEventListener(
                        "click",
                        function () {

                            const barra =
                                barras[indice];

                            if (!barra) return;

                            const activa =
                                aplicarSeleccion(

                                    {
                                        clave:
                                            `histograma-${indice}`,

                                        tipo:
                                            "histograma",

                                        indice:
                                            indice
                                    },

                                    d => {

                                        const h =
                                            numeroValido(
                                                d.total_sleep_hours
                                            );

                                        return (
                                            Number.isFinite(h) &&
                                            h >= barra.inicio &&
                                            (
                                                h < barra.fin ||
                                                (
                                                    barra.fin === 10 &&
                                                    h === 10
                                                )
                                            )
                                        );
                                    }
                                );

                            if (!activa) return;

                            const porcentaje =
                                horas.length > 0
                                    ? barra.frecuencia /
                                      horas.length * 100
                                    : 0;

                            notaHistograma.innerHTML = `
                                <strong>
                                    📌 Intervalo seleccionado
                                </strong>

                                <div>
                                    Horas de sueño:
                                    <strong>
                                    ${barra.inicio} a ${barra.fin}
                                    </strong>
                                </div>

                                <div>
                                    Frecuencia:
                                    <strong>
                                        ${barra.frecuencia}
                                    </strong>
                                </div>

                                <div>
                                    Porcentaje:
                                    <strong>
                                        ${porcentaje.toFixed(1)}%
                                    </strong>
                                </div>
                            `;

                            notaCaja.textContent =
                                "📌 El punto resaltado corresponde al grupo de esta barra.";
                        }
                    );
                }
            );

            // ==================================
            // 15. CLIC EN PUNTOS DE LAS CAJAS
            // ==================================

            puntos.forEach((punto, indice) => {

                punto.style.cursor = "pointer";

                punto.addEventListener(
                    "click",
                    function () {

                        const estadistica =
                            estadisticas[indice];

                        if (!estadistica) return;

                        const activa =
                            aplicarSeleccion(

                                {
                                    clave:
                                        `caja-${estadistica.grupo}`,

                                    tipo:
                                        "caja",

                                    grupo:
                                        estadistica.grupo
                                },

                                d => {

                                    const h =
                                        numeroValido(
                                            d.total_sleep_hours
                                        );

                                    return (
                                        Number.isFinite(h) &&
                                        obtenerGrupo(h) ===
                                        estadistica.grupo
                                    );
                                }
                            );

                        if (!activa) return;

                        notaCaja.innerHTML = `
                            <strong>
                                📌 Grupo seleccionado
                            </strong>

                            <div>
                                Horas de sueño:
                                <strong>
                                    ${estadistica.grupo}
                                </strong>
                            </div>

                            <div>
                                Registros:
                                <strong>
                                    ${estadistica.cantidad}
                                </strong>
                            </div>

                            <div>
                                Mediana de fatiga:
                                <strong>
                                    ${estadistica.mediana.toFixed(1)}
                                </strong>
                            </div>

                            <div>
                                Las tarjetas muestran
                                los promedios de este grupo.
                            </div>
                        `;

                        notaHistograma.textContent =
                            "📌 Las barras resaltadas corresponden al grupo seleccionado.";
                    }
                );
            });

            // ==================================
            // 16. BOTÓN QUITAR SELECCIÓN
            // ==================================

            const boton = document.createElement(
                "button"
            );

            boton.textContent =
                "Quitar selección";

            Object.assign(boton.style, {

                display: "block",

                margin: "15px auto",

                padding: "9px 16px",

                backgroundColor: ROJO,

                color: "white",

                border: "none",

                borderRadius: "5px",

                fontSize: "16px",

                cursor: "pointer"
            });

            boton.addEventListener(
                "click",
                function () {

                    seleccionActual = null;

                    // Tarjetas a cero
                    reiniciarTarjetas();

                    // Quitar resaltados
                    relacionarGraficas();

                    // Restaurar post-it
                    reiniciarNotas();
                }
            );

            contenedorHistograma.appendChild(
                boton
            );

            // ==================================
            // 17. ESTADO INICIAL
            // ==================================

            reiniciarTarjetas();
            reiniciarNotas();
            relacionarGraficas();

            console.log(
                "Dashboard interactivo cargado correctamente."
            );

        })
        .catch(function (error) {

            console.error(
                "Error al cargar el dashboard:",
                error
            );

            contenedorHistograma.textContent =
                "No se pudo cargar el histograma.";

            contenedorCajas.textContent =
                "No se pudo cargar el diagrama de cajas.";
        });

});
