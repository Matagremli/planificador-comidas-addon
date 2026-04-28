# Planificador de comidas

Este add-on ejecuta la app de planificación de comidas dentro de Home Assistant Green.

## Qué hace

- Guarda recetas en SQLite.
- Genera un menú semanal con reglas locales.
- Prepara la base de datos en `/data/dev.db` la primera vez.

## Cómo abrirlo

Cuando el add-on esté arrancado, abre:

- `http://TU_HOME_ASSISTANT:8099`

Ejemplo en red local:

- `http://homeassistant.local:8099`

## Notas

- El puerto expuesto es `8099`.
- La base de datos persiste en `/data`.
- Si actualizas la app, conviene reinstalar o reiniciar el add-on.
- Esta version esta pensada para red local y no para exposicion directa a Internet.
- El add-on no necesita acceso a Docker ni a la API de Home Assistant.
