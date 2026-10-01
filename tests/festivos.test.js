'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Festivos = require('../js/festivos.js');

/** Convierte los festivos de un año en una lista ordenada "día/mes". */
function fechasDe(año, filtro = () => true) {
    return [...Festivos.festivosDelAño(año)]
        .filter(([, nombre]) => filtro(nombre))
        .map(([clave]) => clave.split('-').map(Number))
        .sort((a, b) => a[0] - b[0] || a[1] - b[1])
        .map(([mes, dia]) => `${dia}/${mes + 1}`);
}

// Los festivos locales llevan el nombre del municipio en su descripción.
const soloLocal = (nombre) => nombre.includes(Festivos.MUNICIPIO);
const noLocal = (nombre) => !soloLocal(nombre);

test('domingo de Pascua: fechas conocidas', () => {
    const conocidas = {
        2000: [3, 23], 2019: [3, 21], 2024: [2, 31], 2025: [3, 20],
        2026: [3, 5], 2027: [2, 28], 2038: [3, 25],
    };
    for (const [año, [mes, dia]] of Object.entries(conocidas)) {
        assert.deepEqual(Festivos.domingoDePascua(Number(año)), { mes, dia }, `año ${año}`);
    }
});

test('Andalucía 2026 coincide con el calendario oficial (Decreto 101/2025)', () => {
    assert.deepEqual(fechasDe(2026, noLocal), [
        '1/1', '6/1', '28/2', '2/4', '3/4', '1/5', '15/8', '12/10', '2/11', '7/12', '8/12', '25/12',
    ]);
});

test('Andalucía 2027 coincide con el calendario oficial (Decreto 84/2026)', () => {
    assert.deepEqual(fechasDe(2027, noLocal), [
        '1/1', '6/1', '1/3', '25/3', '26/3', '1/5', '16/8', '12/10', '1/11', '6/12', '8/12', '25/12',
    ]);
});

test('los festivos que caen en domingo se trasladan al lunes y lo indican', () => {
    // 1 de noviembre de 2026 es domingo.
    assert.equal(Festivos.festivoDe(2026, 10, 1), null);
    assert.equal(Festivos.festivoDe(2026, 10, 2), 'Todos los Santos (trasladado al lunes)');
    // 1 de enero de 2023 fue domingo: pasa al lunes 2.
    assert.equal(Festivos.festivoDe(2023, 0, 2), 'Año Nuevo (trasladado al lunes)');
});

test('ningún festivo nacional o autonómico cae en domingo', () => {
    for (let año = 2000; año <= 2099; año++) {
        for (const [clave, nombre] of Festivos.festivosDelAño(año)) {
            if (!noLocal(nombre)) continue;
            const [mes, dia] = clave.split('-').map(Number);
            assert.notEqual(new Date(Date.UTC(año, mes, dia)).getUTCDay(), 0, `${nombre} ${dia}/${mes + 1}/${año}`);
        }
    }
});

test('cada año tiene 12 festivos nacionales y autonómicos', () => {
    for (let año = 2000; año <= 2099; año++) {
        // Un festivo local puede coincidir con Semana Santa: se cuentan nombres, no fechas.
        const nombres = [...Festivos.festivosDelAño(año).values()].join(' / ').split(' / ').filter(noLocal);
        assert.equal(nombres.length, 12, `año ${año}`);
    }
});

test('festivos locales de Loja: 25 de abril y 29 de agosto', () => {
    assert.deepEqual(fechasDe(2026, soloLocal), ['25/4', '29/8']);
    assert.deepEqual(fechasDe(2023, soloLocal), ['25/4', '29/8']);
});

test('festivosDelMes devuelve los festivos ordenados por día', () => {
    assert.deepEqual(Festivos.festivosDelMes(2026, 11), [
        { dia: 7, nombre: 'Día de la Constitución (trasladado al lunes)' },
        { dia: 8, nombre: 'Inmaculada Concepción' },
        { dia: 25, nombre: 'Natividad del Señor' },
    ]);
    assert.deepEqual(Festivos.festivosDelMes(2026, 8), []);
});

test('un día normal no es festivo', () => {
    assert.equal(Festivos.festivoDe(2026, 9, 13), null);
    assert.equal(Festivos.festivoDe(2026, 9, 12), 'Fiesta Nacional de España');
});
