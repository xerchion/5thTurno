'use strict';

/**
 * Festivos del calendario laboral: nacionales, de Andalucía y locales de Loja.
 *
 * Lógica pura, sin acceso al DOM: variable global `Festivos` en el navegador
 * y `require('./js/festivos.js')` en Node.js.
 *
 * Los meses van de 0 (enero) a 11 (diciembre).
 *
 * IMPORTANTE: el calendario oficial se aprueba cada año (Decreto de la Junta
 * de Andalucía para los festivos autonómicos y resolución publicada en BOJA
 * para los locales). La regla de este fichero reproduce los calendarios
 * oficiales conocidos; para un año que se aparte de ella basta con añadirlo
 * a `EXCEPCIONES_POR_AÑO` o a `LOCALES_POR_AÑO`.
 */
const Festivos = (() => {
    /**
     * Festivos de fecha fija en Andalucía: [mes, día, nombre].
     * Si caen en domingo se trasladan al lunes siguiente.
     */
    const FIJOS = Object.freeze([
        [0, 1, 'Año Nuevo'],
        [0, 6, 'Epifanía del Señor'],
        [1, 28, 'Día de Andalucía'],
        [4, 1, 'Fiesta del Trabajo'],
        [7, 15, 'Asunción de la Virgen'],
        [9, 12, 'Fiesta Nacional de España'],
        [10, 1, 'Todos los Santos'],
        [11, 6, 'Día de la Constitución'],
        [11, 8, 'Inmaculada Concepción'],
        [11, 25, 'Natividad del Señor'],
    ]);

    /** Municipio cuyos festivos locales se muestran. */
    const MUNICIPIO = 'Loja';

    /**
     * Festivos locales habituales del municipio: [mes, día, nombre].
     * Cada ayuntamiento los fija año a año; se usan cuando el año no figura
     * en `LOCALES_POR_AÑO`.
     */
    const LOCALES_HABITUALES = Object.freeze([
        [3, 25, 'San Marcos (fiesta local de Loja)'],
        [7, 29, 'Fiesta local de Loja'],
    ]);

    /**
     * Festivos locales de años concretos, cuando difieren de los habituales.
     * Ejemplo: 2027: [[3, 26, 'San Marcos (fiesta local de Loja)'], [7, 30, 'Fiesta local de Loja']]
     */
    const LOCALES_POR_AÑO = Object.freeze({});

    /**
     * Calendario completo de años que no siguen la regla general.
     * Si un año aparece aquí, se usa esta lista tal cual: [mes, día, nombre].
     */
    const EXCEPCIONES_POR_AÑO = Object.freeze({});

    const cache = new Map();

    /**
     * Domingo de Pascua en el calendario gregoriano
     * (algoritmo anónimo gregoriano de Meeus/Jones/Butcher).
     * @returns {{mes: number, dia: number}}
     */
    function domingoDePascua(año) {
        const a = año % 19;
        const b = Math.floor(año / 100);
        const c = año % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1;
        const dia = ((h + l - 7 * m + 114) % 31) + 1;
        return { mes, dia };
    }

    /** Fecha (UTC) desplazada un número de días. */
    function desplazar(año, mes, dia, dias) {
        const fecha = new Date(Date.UTC(año, mes, dia + dias));
        return { mes: fecha.getUTCMonth(), dia: fecha.getUTCDate() };
    }

    function esDomingo(año, mes, dia) {
        return new Date(Date.UTC(año, mes, dia)).getUTCDay() === 0;
    }

    function clave(mes, dia) {
        return `${mes}-${dia}`;
    }

    function añadir(mapa, mes, dia, nombre) {
        const k = clave(mes, dia);
        mapa.set(k, mapa.has(k) ? `${mapa.get(k)} / ${nombre}` : nombre);
    }

    /**
     * Festivos de un año.
     * @returns {Map<string, string>} clave "mes-día" (mes 0–11) → nombre
     */
    function festivosDelAño(año) {
        if (cache.has(año)) return cache.get(año);

        const mapa = new Map();

        if (EXCEPCIONES_POR_AÑO[año]) {
            for (const [mes, dia, nombre] of EXCEPCIONES_POR_AÑO[año]) {
                añadir(mapa, mes, dia, nombre);
            }
        } else {
            for (const [mes, dia, nombre] of FIJOS) {
                if (esDomingo(año, mes, dia)) {
                    const lunes = desplazar(año, mes, dia, 1);
                    añadir(mapa, lunes.mes, lunes.dia, `${nombre} (trasladado al lunes)`);
                } else {
                    añadir(mapa, mes, dia, nombre);
                }
            }

            const pascua = domingoDePascua(año);
            const jueves = desplazar(año, pascua.mes, pascua.dia, -3);
            const viernes = desplazar(año, pascua.mes, pascua.dia, -2);
            añadir(mapa, jueves.mes, jueves.dia, 'Jueves Santo');
            añadir(mapa, viernes.mes, viernes.dia, 'Viernes Santo');
        }

        const locales = LOCALES_POR_AÑO[año] || LOCALES_HABITUALES;
        for (const [mes, dia, nombre] of locales) {
            añadir(mapa, mes, dia, nombre);
        }

        cache.set(año, mapa);
        return mapa;
    }

    /**
     * Nombre del festivo de una fecha, o `null` si no lo es.
     */
    function festivoDe(año, mes, dia) {
        return festivosDelAño(año).get(clave(mes, dia)) || null;
    }

    /**
     * Festivos de un mes, ordenados por día.
     * @returns {Array<{dia: number, nombre: string}>}
     */
    function festivosDelMes(año, mes) {
        const lista = [];
        for (const [k, nombre] of festivosDelAño(año)) {
            const [m, d] = k.split('-').map(Number);
            if (m === mes) lista.push({ dia: d, nombre });
        }
        return lista.sort((a, b) => a.dia - b.dia);
    }

    return Object.freeze({
        MUNICIPIO,
        FIJOS,
        LOCALES_HABITUALES,
        LOCALES_POR_AÑO,
        EXCEPCIONES_POR_AÑO,
        domingoDePascua,
        festivosDelAño,
        festivoDe,
        festivosDelMes,
    });
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Festivos;
}
