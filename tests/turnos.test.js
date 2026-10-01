'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Turnos = require('../js/turnos.js');

/** Recorre todos los días entre dos años (ambos incluidos). */
function* diasEntre(añoInicio, añoFin) {
    for (let año = añoInicio; año <= añoFin; año++) {
        for (let mes = 0; mes < 12; mes++) {
            const total = Turnos.diasDelMes(año, mes);
            for (let dia = 1; dia <= total; dia++) yield [año, mes, dia];
        }
    }
}

/**
 * Algoritmo original de la v2.6 (array gigante recorrido desde el 1 de enero
 * de 2022), reescrito aquí como referencia para comprobar que la fórmula
 * nueva da exactamente los mismos turnos.
 */
function turnosDelAñoSegunV26(equipo, año) {
    const rep = [2, 2, 3, 4, 3, 2, 2, 5, 2, 3, 2, 5];
    const valor = ['M', 'T', 'N', 'D', 'M', 'T', 'N', 'D', 'M', 'T', 'N', 'D'];
    const patron = [];
    while (patron.length < 10000) {
        valor.forEach((v, i) => {
            for (let j = 0; j < rep[i]; j++) patron.push(v);
        });
    }
    const bisiesto = (a) => (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;
    let dias = 0;
    for (let a = 2022; a < año; a++) dias += bisiesto(a) ? 366 : 365;
    const inicio = { A: 19, B: 33, C: 12, D: 26, E: 5 }[equipo] + dias;
    const totalAño = bisiesto(año) ? 366 : 365;
    return patron.slice(inicio, inicio + totalAño);
}

test('el ciclo dura 35 días: 7 mañanas, 7 tardes, 7 noches y 14 descansos', () => {
    assert.equal(Turnos.CICLO.length, 35);
    assert.equal(Turnos.CICLO.join(''), 'MMTTNNNDDDDMMMTTNNDDDDDMMTTTNNDDDDD');
    const cuenta = { M: 0, T: 0, N: 0, D: 0 };
    Turnos.CICLO.forEach((t) => cuenta[t]++);
    assert.deepEqual(cuenta, { M: 7, T: 7, N: 7, D: 14 });
});

test('los equipos están separados exactamente 7 días entre sí', () => {
    const desfases = Object.values(Turnos.DESFASE).sort((a, b) => a - b);
    assert.deepEqual(desfases, [5, 12, 19, 26, 33]);
});

test('cada día hay un equipo de mañana, uno de tarde, uno de noche y dos de descanso', () => {
    for (const [año, mes, dia] of diasEntre(2000, 2099)) {
        const reparto = Turnos.EQUIPOS.map((e) => Turnos.turnoDe(e, año, mes, dia)).sort().join('');
        assert.equal(reparto, 'DDMNT', `fallo el ${dia}/${mes + 1}/${año}`);
    }
});

test('de 2022 en adelante da los mismos turnos que el algoritmo original (v2.6)', () => {
    for (const equipo of Turnos.EQUIPOS) {
        for (let año = 2022; año <= 2040; año++) {
            const esperado = turnosDelAñoSegunV26(equipo, año);
            const obtenido = [];
            for (let mes = 0; mes < 12; mes++) obtenido.push(...Turnos.turnosDelMes(equipo, año, mes));
            assert.equal(obtenido.join(''), esperado.join(''), `equipo ${equipo}, año ${año}`);
        }
    }
});

test('antes de 2022 la rotación continúa hacia atrás sin saltos', () => {
    for (const equipo of Turnos.EQUIPOS) {
        // El 31-dic-2021 ocupa la posición anterior a la del 1-ene-2022.
        const posicion = (Turnos.DESFASE[equipo] - 1 + 35) % 35;
        assert.equal(Turnos.turnoDe(equipo, 2021, 11, 31), Turnos.CICLO[posicion]);
    }
    // Y 2021 ya no es una copia de 2022 (el fallo de la v2.6).
    const enero2021 = Turnos.turnosDelMes('C', 2021, 0).join('');
    const enero2022 = Turnos.turnosDelMes('C', 2022, 0).join('');
    assert.notEqual(enero2021, enero2022);
});

test('el turno se repite cada 35 días', () => {
    for (const equipo of Turnos.EQUIPOS) {
        assert.equal(Turnos.turnoDe(equipo, 2026, 9, 2), Turnos.turnoDe(equipo, 2026, 10, 6));
    }
});

test('valores conocidos: octubre de 2026', () => {
    assert.equal(Turnos.turnosDelMes('C', 2026, 9).join(''), 'DDDDMMTTNNNDDDDMMMTTNNDDDDDMMTT');
    assert.equal(Turnos.turnosDelMes('D', 2026, 9).join(''), 'DMMMTTNNDDDDDMMTTTNNDDDDDMMTTNN');
});

test('diasDelMes tiene en cuenta los años bisiestos', () => {
    assert.equal(Turnos.diasDelMes(2024, 1), 29);
    assert.equal(Turnos.diasDelMes(2026, 1), 28);
    assert.equal(Turnos.diasDelMes(2100, 1), 28);
    assert.equal(Turnos.diasDelMes(2000, 1), 29);
    assert.equal(Turnos.diasDelMes(2026, 11), 31);
});

test('equipoVecino recorre los equipos de forma circular', () => {
    assert.equal(Turnos.equipoVecino('A', 1), 'B');
    assert.equal(Turnos.equipoVecino('E', 1), 'A');
    assert.equal(Turnos.equipoVecino('A', -1), 'E');
});

test('turnoDe rechaza equipos desconocidos', () => {
    assert.throws(() => Turnos.turnoDe('Z', 2026, 0, 1), RangeError);
});
