'use strict';

/**
 * Interfaz del calendario: estado, pintado del mes y navegación.
 * Depende de las variables globales `Turnos` (js/turnos.js) y `Festivos`
 * (js/festivos.js), que deben cargarse antes que este fichero.
 */
(() => {
    const NOMBRES_MESES = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    const DIAS_SEMANA = [
        ['L', 'Lunes'], ['M', 'Martes'], ['X', 'Miércoles'], ['J', 'Jueves'],
        ['V', 'Viernes'], ['S', 'Sábado'], ['D', 'Domingo'],
    ];
    const CLASE_TURNO = { M: 'morning', T: 'afternoon', N: 'night', D: 'dayoff' };

    const EQUIPO_POR_DEFECTO = 'C';
    const CLAVE_EQUIPO = '5thturno.equipo';
    const AÑO_MIN = 2000;
    const AÑO_MAX = 2099;

    const formatoFecha = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
    });

    const hoy = new Date();
    const estado = {
        equipo: leerEquipoGuardado(),
        año: hoy.getFullYear(),
        mes: hoy.getMonth(),
    };

    const el = {};

    // ----- Preferencias -----

    function leerEquipoGuardado() {
        try {
            const guardado = localStorage.getItem(CLAVE_EQUIPO);
            if (Turnos.EQUIPOS.includes(guardado)) return guardado;
        } catch (error) {
            // Almacenamiento no disponible (modo privado, permisos…): se usa el valor por defecto.
        }
        return EQUIPO_POR_DEFECTO;
    }

    function guardarEquipo(equipo) {
        try {
            localStorage.setItem(CLAVE_EQUIPO, equipo);
        } catch (error) {
            // Sin almacenamiento, el equipo simplemente no se recuerda.
        }
    }

    // ----- Pintado -----

    function crear(etiqueta, clase, texto) {
        const nodo = document.createElement(etiqueta);
        if (clase) nodo.className = clase;
        if (texto !== undefined) nodo.textContent = texto;
        return nodo;
    }

    function crearCabeceras() {
        return DIAS_SEMANA.map(([letra, nombre]) => {
            const cabecera = crear('div', 'weekday');
            const abreviatura = crear('abbr', '', letra);
            abreviatura.title = nombre;
            cabecera.appendChild(abreviatura);
            return cabecera;
        });
    }

    function crearCeldaVacia() {
        const celda = crear('div', 'calendar-day other-month');
        celda.setAttribute('aria-hidden', 'true');
        return celda;
    }

    function crearCeldaDia(dia, turno, festivo, esHoy) {
        const celda = crear('div', `calendar-day ${CLASE_TURNO[turno]}`);
        const nombreTurno = Turnos.NOMBRES_TURNO[turno];
        const fecha = formatoFecha.format(new Date(Date.UTC(estado.año, estado.mes, dia)));

        let descripcion = `${fecha}: ${nombreTurno}.`;
        let ayuda = nombreTurno;
        if (festivo) {
            celda.classList.add('holiday');
            descripcion += ` Festivo: ${festivo}.`;
            ayuda += ` · Festivo: ${festivo}`;
        }
        if (esHoy) {
            celda.classList.add('today');
            celda.setAttribute('aria-current', 'date');
            descripcion += ' Hoy.';
            ayuda += ' · Hoy';
        }
        celda.title = ayuda;

        const numero = crear('span', 'day-number', String(dia));
        numero.setAttribute('aria-hidden', 'true');
        celda.appendChild(numero);
        celda.appendChild(crear('span', 'sr-only', descripcion));
        return celda;
    }

    function pintarFestivosDelMes() {
        const festivos = Festivos.festivosDelMes(estado.año, estado.mes);
        el.listaFestivos.textContent = '';
        el.listaFestivos.hidden = festivos.length === 0;
        festivos.forEach(({ dia, nombre }) => {
            const item = crear('li');
            item.appendChild(crear('strong', '', String(dia)));
            item.appendChild(document.createTextNode(` ${nombre}`));
            el.listaFestivos.appendChild(item);
        });
    }

    function pintar() {
        const { equipo, año, mes } = estado;
        const ahora = new Date();
        const esMesActual = ahora.getFullYear() === año && ahora.getMonth() === mes;

        el.turno.textContent = `Turno ${equipo}`;
        el.año.textContent = String(año);
        el.mes.textContent = NOMBRES_MESES[mes];
        el.añoAnterior.disabled = año <= AÑO_MIN;
        el.añoSiguiente.disabled = año >= AÑO_MAX;
        el.mesAnterior.disabled = año <= AÑO_MIN && mes === 0;
        el.mesSiguiente.disabled = año >= AÑO_MAX && mes === 11;

        const celdas = crearCabeceras();

        // Huecos hasta el primer día (la semana empieza en lunes).
        const primerDiaSemana = (new Date(Date.UTC(año, mes, 1)).getUTCDay() + 6) % 7;
        for (let i = 0; i < primerDiaSemana; i++) celdas.push(crearCeldaVacia());

        Turnos.turnosDelMes(equipo, año, mes).forEach((turno, indice) => {
            const dia = indice + 1;
            const festivo = Festivos.festivoDe(año, mes, dia);
            const esHoy = esMesActual && ahora.getDate() === dia;
            celdas.push(crearCeldaDia(dia, turno, festivo, esHoy));
        });

        // Huecos hasta completar la última semana.
        while (celdas.length % DIAS_SEMANA.length !== 0) celdas.push(crearCeldaVacia());

        el.rejilla.replaceChildren(...celdas);
        pintarFestivosDelMes();
    }

    // ----- Navegación -----

    function cambiarEquipo(paso) {
        estado.equipo = Turnos.equipoVecino(estado.equipo, paso);
        guardarEquipo(estado.equipo);
        pintar();
    }

    function cambiarAño(paso) {
        const año = estado.año + paso;
        if (año < AÑO_MIN || año > AÑO_MAX) return;
        estado.año = año;
        pintar();
    }

    function cambiarMes(paso) {
        let mes = estado.mes + paso;
        let año = estado.año;
        if (mes < 0) { mes = 11; año--; }
        if (mes > 11) { mes = 0; año++; }
        if (año < AÑO_MIN || año > AÑO_MAX) return;
        estado.mes = mes;
        estado.año = año;
        pintar();
    }

    // ----- Arranque -----

    function iniciar() {
        el.turno = document.getElementById('turnoTitle');
        el.año = document.getElementById('yearTitle');
        el.mes = document.getElementById('monthTitle');
        el.rejilla = document.getElementById('calendarGrid');
        el.listaFestivos = document.getElementById('holidayList');
        el.añoAnterior = document.getElementById('prevYear');
        el.añoSiguiente = document.getElementById('nextYear');
        el.mesAnterior = document.getElementById('prevMonth');
        el.mesSiguiente = document.getElementById('nextMonth');

        document.getElementById('prevTurno').addEventListener('click', () => cambiarEquipo(-1));
        document.getElementById('nextTurno').addEventListener('click', () => cambiarEquipo(1));
        el.añoAnterior.addEventListener('click', () => cambiarAño(-1));
        el.añoSiguiente.addEventListener('click', () => cambiarAño(1));
        el.mesAnterior.addEventListener('click', () => cambiarMes(-1));
        el.mesSiguiente.addEventListener('click', () => cambiarMes(1));

        // Si la pestaña se queda abierta de un día para otro, se actualiza la marca de "hoy".
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) pintar();
        });

        pintar();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();
