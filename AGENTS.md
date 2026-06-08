\# AGENTS.md



\## Proyecto



Este repositorio corresponde a Cannabis Club Manager.



Antes de realizar cambios de backend, leer:



\- docs/backend-roadmap-codex.md



\## Reglas obligatorias de base de datos



\- Usar Prisma + SQLite en desarrollo.

\- Usar ids numéricos autoincrementales.

\- No usar cuid(), uuid() ni ids tipo texto como primary key.

\- Todas las foreign keys deben usar formato snake\_case: nombre\_tabla\_id.

\- Las tablas deben usar snake\_case.

\- Los códigos visibles se usan solo en entidades operativas importantes, por ejemplo codigo\_planta, codigo\_socio, codigo\_lote, codigo\_cosecha.

\- No incluir archivos .db en el repo.

\- La base debe poder regenerarse con migraciones y seed.



\## Forma de trabajo



\- Implementar el backend por instancias.

\- No avanzar a la instancia 2 hasta terminar la instancia 1.

\- No avanzar a la instancia 3 hasta terminar la instancia 2.

\- Mantener el frontend funcionando aunque algunas pantallas sigan con mock data.

\- Antes de modificar una pantalla, revisar si actualmente usa mock data o API real.

