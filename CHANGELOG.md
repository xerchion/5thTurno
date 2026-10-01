# Registro de cambios

## 3.0.0 — 2026-10-02

### Corregido

- Los años anteriores a 2022 mostraban los turnos de 2022. La rotación se calcula ahora con aritmética modular y es correcta para cualquier fecha.
- El día de hoy perdía el color de su turno. Ahora lo conserva y se marca con un marco.
- En escritorio el mes no cabía en pantalla. La página se ajusta al alto de la ventana.

### Cambiado

- Festivos calculados para cada año en lugar de ocho fechas fijas: nacionales y de Andalucía (con traslado al lunes y Semana Santa) y locales de Loja.
- El festivo ya no tapa el turno: se indica con un punto rojo y se lista bajo el calendario.
- En pantallas anchas, los controles de turno, año y mes van en una sola fila.
- Código separado en `js/turnos.js`, `js/festivos.js` y `js/app.js`.
- El calendario se puede recorrer de 2000 a 2099.

### Añadido

- El equipo elegido se recuerda entre visitas.
- Pruebas automáticas de la rotación y los festivos, y flujo de GitHub Actions.
- Textos para lectores de pantalla, nombres en los botones e idioma de la página.
- Icono, descripción e imagen de vista previa al compartir el enlace.
- Documentación técnica en español e inglés.

### Eliminado

- Formulario de selección de año y turno, que ya no se podía abrir.
- Código sin uso de la vista anual y mensajes de depuración en consola.

## Versiones anteriores

El desarrollo hasta la 2.6 está en el repositorio original, [xerchion/5thTurno2](https://github.com/xerchion/5thTurno2):

- **2.6** (septiembre de 2025): enlace al portfolio y rama de producción.
- **2.5** (agosto–septiembre de 2025): vista mensual con navegación por turno, año y mes; leyenda; adaptación a móvil.
- **2.0** (agosto de 2025): vista anual con formulario de selección y leyenda en ventana modal.
