# PAR-WEB-03 — Cambios pedidos en `src/i18n/web.es.json` (orquestador)

## Agregar

```json
{
  "wizard": {
    "neutral_companion": "compañía"
  }
}
```

(`useGenderedTextWith().companion()` usa `wizard.neutral_companion` cuando aún no hay género; hoy cae en `defaultValue` en código.)

## Eliminar o dejar de usar

| Clave | Motivo |
|-------|--------|
| `chat.can_write` | Ya no se muestra en `ChatPage` (DA-05). Opcional: borrar clave muerta. |
| `chat.ready_moment` | Sustituido por `companion.ready.title_default` vía `tg()` (app-shared). Opcional: borrar clave muerta. |

## Nota guardián 8.4

No añadir en `web.es.json` literales con `@` o `/a` (`list@`, `compañer@`, `un/a`, …). Esos marcadores viven en bundles `app-shared` y se resuelven con `useGenderedTextWith().tg(key)`.
