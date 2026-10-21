# eJoi Web — agentes

Modo **Ponytail** (lazy senior dev): regla en [`.cursor/rules/ponytail.mdc`](.cursor/rules/ponytail.mdc), hooks en [`.cursor/hooks.json`](.cursor/hooks.json).

- Checkout Ponytail: `C:\ejoi\ejoiFE\ejoi\ponytail` (compartido con la app móvil).
- Instalar / refrescar en esta máquina: `npm run ponytail:install` y `npm run ponytail:skills`
- En chat: `/ponytail`, `/ponytail-review`, `/ponytail-debt`, etc. (skills en `.cursor/skills/`).

**Diseño (Impeccable + Taste Skill):** copias locales en `.cursor/skills/` (gitignored). Reinstalar: `npx impeccable install`, `npx skills add Leonxlnx/taste-skill`, luego `npm run ponytail:skills`. Lock de Taste: `skills-lock.json` (versionar si el equipo acuerda pin).

Convenciones del repo: README (sync `app-shared`, `src/platform/`, variables `.env.local`).
