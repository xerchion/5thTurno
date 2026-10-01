'use strict';

/**
 * Rotación de turnos de 5 equipos (A–E) en régimen 24/7.
 *
 * Lógica pura, sin acceso al DOM: se puede usar en el navegador (variable
 * global `Turnos`) y en Node.js (`require('./js/turnos.js')`) para las pruebas.
 *
 * Convención de fechas: los meses van de 0 (enero) a 11 (diciembre), igual
 * que en el objeto `Date` de JavaScript.
 */
const Turnos = (() => {
    const EQUIPOS = Object.freeze(['A', 'B', 'C', 'D', 'E']);

    const NOMBRES_TURNO = Object.freeze({
        M: 'Mañana',
        T: 'Tarde',
        N: 'Noche',
        D: 'Descanso',
    });

    /**
     * Ciclo de rotación, como bloques [turno, número de días].
     * Suma 35 días: tres tandas de 7 días de trabajo seguidas de 4, 5 y 5
     * días de descanso.
     */
    const BLOQUES = Object.freeze([
        ['M', 2], ['T', 2], ['N', 3], ['D', 4],
        ['M', 3], ['T', 2], ['N', 2], ['D', 5],
        ['M', 2], ['T', 3], ['N', 2], ['D', 5],
    ]);

    /** El ciclo desplegado día a día: 35 posiciones con 'M', 'T', 'N' o 'D'. */
    const CICLO = Object.freeze(
        BLOQUES.flatMap(([turno, dias]) => Array(dias).fill(turno))
    );

    /** Fecha de referencia de la rotación: 1 de enero de 2022. */
    const AÑO_REFERENCIA = 2022;
    const REFERENCIA_UTC = Date.UTC(AÑO_REFERENCIA, 0, 1);

    /**
     * Posición de cada equipo dentro del ciclo en la fecha de referencia.
     * Los equipos van separados exactamente 7 días entre sí, lo que garantiza
     * que cada día haya uno de mañana, uno de tarde, uno de noche y dos de
     * descanso.
     */
    const DESFASE = Object.freeze({ A: 19, B: 33, C: 12, D: 26, E: 5 });

    const MS_POR_DIA = 24 * 60 * 60 * 1000;

    /** Resto siempre positivo (el operador % de JS devuelve negativos). */
    function modulo(n, m) {
        return ((n % m) + m) % m;
    }

    /**
     * Días transcurridos entre la fecha de referencia y la fecha dada.
     * Negativo para fechas anteriores a 2022. Se calcula en UTC para que los
     * cambios de hora no alteren la cuenta.
     */
    function diasDesdeReferencia(año, mes, dia) {
        return Math.round((Date.UTC(año, mes, dia) - REFERENCIA_UTC) / MS_POR_DIA);
    }

    /** Número de días del mes (tiene en cuenta los años bisiestos). */
    function diasDelMes(año, mes) {
        return new Date(Date.UTC(año, mes + 1, 0)).getUTCDate();
    }

    /**
     * Turno que le corresponde a un equipo en una fecha.
     * @param {string} equipo 'A', 'B', 'C', 'D' o 'E'
     * @param {number} año
     * @param {number} mes 0–11
     * @param {number} dia 1–31
     * @returns {'M'|'T'|'N'|'D'}
     */
    function turnoDe(equipo, año, mes, dia) {
        if (!Object.prototype.hasOwnProperty.call(DESFASE, equipo)) {
            throw new RangeError(`Equipo desconocido: ${equipo}`);
        }
        const posicion = DESFASE[equipo] + diasDesdeReferencia(año, mes, dia);
        return CICLO[modulo(posicion, CICLO.length)];
    }

    /**
     * Turnos de un equipo para todos los días de un mes.
     * @returns {Array<'M'|'T'|'N'|'D'>} posición 0 = día 1
     */
    function turnosDelMes(equipo, año, mes) {
        const total = diasDelMes(año, mes);
        const turnos = [];
        for (let dia = 1; dia <= total; dia++) {
            turnos.push(turnoDe(equipo, año, mes, dia));
        }
        return turnos;
    }

    /** Equipo siguiente (paso = 1) o anterior (paso = -1), de forma circular. */
    function equipoVecino(equipo, paso) {
        const indice = EQUIPOS.indexOf(equipo);
        return EQUIPOS[modulo(indice + paso, EQUIPOS.length)];
    }

    return Object.freeze({
        EQUIPOS,
        NOMBRES_TURNO,
        BLOQUES,
        CICLO,
        DESFASE,
        AÑO_REFERENCIA,
        diasDesdeReferencia,
        diasDelMes,
        turnoDe,
        turnosDelMes,
        equipoVecino,
    });
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Turnos;
}
