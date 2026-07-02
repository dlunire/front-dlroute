# ─────────────────────────────────────────────────────────────────────────────
# @dlunire/front-dlroute — Makefile
# Ciclo completo de construcción, versionado y publicación en npm.
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: build publish patch minor major check clean help

# ── Construcción ──────────────────────────────────────────────────────────────

## Compila el proyecto TypeScript y genera los archivos de distribución
build:
	pnpm run build

# ── Publicación directa ───────────────────────────────────────────────────────

## Publica la versión actual en npm (requiere haber versionado antes)
publish: build
	pnpm publish

# ── Versionado + publicación ──────────────────────────────────────────────────

## Incrementa la versión patch (1.0.0 → 1.0.1) y publica
## Usar para: correcciones, actualizaciones de documentación, ajustes menores
patch: check
	pnpm version patch
	git push --follow-tags
	pnpm publish

## Incrementa la versión minor (1.0.0 → 1.1.0) y publica
## Usar para: nuevas funcionalidades que no rompen la API existente
minor: check
	pnpm version minor
	git push --follow-tags
	pnpm publish

## Incrementa la versión major (1.0.0 → 2.0.0) y publica
## Usar para: cambios que rompen compatibilidad con versiones anteriores
major: check
	pnpm version major
	git push --follow-tags
	pnpm publish

# ── Validaciones ──────────────────────────────────────────────────────────────

## Verifica que el working tree esté limpio antes de versionar
check:
	@git diff --quiet && git diff --cached --quiet || \
		(echo "\n❌ Hay cambios sin commitear. Ejecuta 'git add . && git commit' primero.\n" && exit 1)
	@echo "✅ Working tree limpio"

# ── Limpieza ──────────────────────────────────────────────────────────────────

## Elimina los archivos de distribución generados por la compilación
clean:
	rm -rf dist

# ── Ayuda ─────────────────────────────────────────────────────────────────────

## Muestra esta ayuda
help:
	@echo ""
	@echo "  @dlunire/front-dlroute — Comandos disponibles"
	@echo "  ─────────────────────────────────────────────"
	@echo "  make build    Compila TypeScript → dist/"
	@echo "  make publish  Publica la versión actual en npm"
	@echo "  make patch    Versión patch (docs, fixes) → publica"
	@echo "  make minor    Versión minor (nueva funcionalidad) → publica"
	@echo "  make major    Versión major (breaking change) → publica"
	@echo "  make clean    Elimina dist/"
	@echo "  make help     Muestra esta ayuda"
	@echo ""