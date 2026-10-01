# 5thTurno · Rotating shift calendar

[Español](README.md) · **English**

[![Tests](https://github.com/xerchion/5thTurno/actions/workflows/tests.yml/badge.svg)](https://github.com/xerchion/5thTurno/actions/workflows/tests.yml)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A web calendar that shows which shift each of the five crews (A–E) of a 24/7 rotation works on any day: morning, afternoon, night or rest, with public holidays marked.

**[Open the calendar →](https://xerchion.github.io/5thTurno/)**

The interface is in Spanish: *Mañana* = morning, *Tarde* = afternoon, *Noche* = night, *Descanso* = rest day, *Festivo* = public holiday, *Hoy* = today.

| Desktop | Mobile |
| --- | --- |
| ![Desktop view: December 2026, crew C](docs/img/escritorio.png) | <img src="docs/img/movil.png" alt="Mobile view: December 2026, crew C" width="260"> |

## What it does

- Shows the full month for any crew, with one colour per shift.
- Lets you switch crew, month and year with the arrow buttons (2000 to 2099).
- Marks public holidays with a red dot without hiding the shift, and lists them below the calendar.
- Highlights today with a frame.
- Remembers the selected crew between visits.
- Fits the screen: the whole month is visible without scrolling, on mobile and desktop.

Everything is computed in the browser. There is no server, database or account, and no data is sent anywhere.

## How the rotation works

All five crews follow the same 35-day cycle, each one shifted 7 days from the previous one:

```
MM TT NNN DDDD  |  MMM TT NN DDDDD  |  MM TTT NN DDDDD
```

`M` morning · `T` afternoon · `N` night · `D` rest

That is three runs of 7 working days followed by 4, 5 and 5 rest days. With that offset, every day has exactly one crew on mornings, one on afternoons, one on nights and two resting.

A crew's shift on a given date takes a single operation:

```
shift = CYCLE[(crew offset + days since 1 Jan 2022) mod 35]
```

The full explanation, with a worked example, is in [docs/HOW-IT-WORKS.md](docs/HOW-IT-WORKS.md).

## Public holidays

They are computed for each year:

- **Spain and Andalusia:** ten fixed-date holidays plus Maundy Thursday and Good Friday. Those falling on a Sunday move to the Monday.
- **Local holidays for Loja (Granada):** 25 April and 29 August.

The official calendar is approved every year, so the rule may need an occasional adjustment. The `LOCALES_POR_AÑO` and `EXCEPCIONES_POR_AÑO` tables in [`js/festivos.js`](js/festivos.js) exist for that; the procedure is in the [technical documentation](docs/HOW-IT-WORKS.md#public-holidays).

## Running it locally

There is nothing to install or build. Clone the repository and open `index.html` in a browser:

```bash
git clone https://github.com/xerchion/5thTurno.git
cd 5thTurno
```

To serve it over HTTP instead:

```bash
python -m http.server 8000
# http://localhost:8000
```

## Tests

The shift and holiday logic is covered by automated tests using the test runner built into Node.js (18 or later), with no dependencies:

```bash
npm test
```

Among other things, they check that every day from 2000 to 2099 has one crew on each shift, and that the Andalusian holidays for 2026 and 2027 match the official calendar.

## Layout

```
index.html            Page and controls
css/styles.css        Styles and screen adaptation
js/turnos.js          Shift rotation (pure logic)
js/festivos.js        Holidays for each year (pure logic)
js/app.js             Interface: state, rendering and navigation
tests/                Tests for turnos.js and festivos.js
docs/                 Technical documentation and screenshots
img/                  Icon and link-preview image
```

Identifiers and comments in the code are in Spanish.

## Adapting it to another rotation

| To change | Edit |
| --- | --- |
| The shift sequence | `BLOQUES` in `js/turnos.js` |
| Each crew's starting point | `DESFASE` and the reference date in `js/turnos.js` |
| Regional holidays | `FIJOS` in `js/festivos.js` |
| The town and its local holidays | `MUNICIPIO`, `LOCALES_HABITUALES` and `LOCALES_POR_AÑO` in `js/festivos.js` |

After any change, `npm test` tells you whether the rotation still covers every shift.

## Limitations

- The rotation is extended backwards and forwards from 1 January 2022 unchanged. If the real roster was modified at some point, earlier dates will not reflect it.
- Holidays for future years follow the general rule; each year's decree may depart from it.
- Loja's local holidays are set year by year. Those for 2027 had not been published when this version was released, and the usual dates fall on a Sunday that year.

## Technology

HTML, CSS and JavaScript with no libraries and no build step. The Inter typeface is loaded from Google Fonts, with system fonts as a fallback. Published with GitHub Pages.

## License

[MIT](LICENSE) © Sergio Ucedo · [Portfolio](https://xerchion.github.io/portfolio-web/)
