-- AlterTable: agrega metadata de archivo en documentos_socio
ALTER TABLE "documentos_socio" ADD COLUMN "nombre_archivo" TEXT;
ALTER TABLE "documentos_socio" ADD COLUMN "mime_type" TEXT;
ALTER TABLE "documentos_socio" ADD COLUMN "tamanio_bytes" INTEGER;
ALTER TABLE "documentos_socio" ADD COLUMN "subido_en" DATETIME;
