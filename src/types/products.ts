// Tipos que reflejan los modelos Prisma (IDs numéricos, snake_case mapeado a camelCase).

export type TipoProducto = "flor" | "aceite" | "extracto" | "comestible" | "insumo" | "otro";
export type UnidadMedida  = "gramos" | "mililitros" | "unidades";
export type EstadoProducto = "activo" | "inactivo";
export type EstadoCategoria = "activa" | "inactiva";
export type EstadoUbicacion = "activa" | "inactiva";
export type TipoUbicacion = "deposito" | "freezer" | "heladera" | "sala_curado" | "armario" | "otro";
export type EstadoLote =
  | "disponible"
  | "reservado"
  | "agotado"
  | "bloqueado"
  | "descartado"
  | "en_analisis";

export interface CategoriaProducto {
  id: number;
  codigoCategoria: string;
  nombre: string;
  descripcion: string | null;
  estado: EstadoCategoria;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Producto {
  id: number;
  codigoProducto: string;
  categoriaProductoId: number | null;
  nombre: string;
  tipoProducto: TipoProducto;
  unidadMedida: UnidadMedida;
  descripcion: string | null;
  estado: EstadoProducto;
  requiereLote: boolean;
  requiereTrazabilidad: boolean;
  creadoEn: string;
  actualizadoEn: string;
  categoria?: { id: number; nombre: string; codigoCategoria: string } | null;
}

export interface UbicacionStock {
  id: number;
  codigoUbicacion: string;
  nombre: string;
  tipo: TipoUbicacion;
  descripcion: string | null;
  estado: EstadoUbicacion;
  creadoEn: string;
  actualizadoEn: string;
}

export interface LoteProducto {
  id: number;
  codigoLoteProducto: string;
  productoId: number;
  cosechaId: number | null;
  loteCultivoId: number | null;
  geneticaId: number | null;
  ubicacionStockId: number | null;
  fechaIngreso: string;
  fechaVencimiento: string | null;
  cantidadInicial: number;
  cantidadDisponible: number;
  cantidadReservada: number;
  unidadMedida: UnidadMedida;
  estado: EstadoLote;
  observaciones: string | null;
  creadoEn: string;
  actualizadoEn: string;
  producto?: { id: number; codigoProducto: string; nombre: string; unidadMedida: UnidadMedida } | null;
  cosecha?: { id: number; codigoCosecha: string; pesoSecoGramos: number } | null;
  loteCultivo?: { id: number; codigoLote: string } | null;
  genetica?: { id: number; nombre: string } | null;
  ubicacionStock?: { id: number; nombre: string; codigoUbicacion: string } | null;
}

export interface ProductBatchSummary {
  productosActivos: number;
  lotesDisponibles: number;
  stockTotalDisponible: number;
  lotesBloqueadosAnalisis: number;
  proximosVencimientos: number;
  totalLotes: number;
}

// Payloads

export type CreateCategoriaPayload = {
  codigoCategoria: string;
  nombre: string;
  descripcion?: string | null;
  estado?: EstadoCategoria;
};

export type UpdateCategoriaPayload = Partial<Omit<CreateCategoriaPayload, "codigoCategoria">>;

export type CreateProductoPayload = {
  codigoProducto: string;
  categoriaProductoId?: number | null;
  nombre: string;
  tipoProducto: TipoProducto;
  unidadMedida?: UnidadMedida;
  descripcion?: string | null;
  estado?: EstadoProducto;
  requiereLote?: boolean;
  requiereTrazabilidad?: boolean;
};

export type UpdateProductoPayload = Partial<Omit<CreateProductoPayload, "codigoProducto">>;

export type CreateUbicacionPayload = {
  codigoUbicacion: string;
  nombre: string;
  tipo: TipoUbicacion;
  descripcion?: string | null;
  estado?: EstadoUbicacion;
};

export type UpdateUbicacionPayload = Partial<Omit<CreateUbicacionPayload, "codigoUbicacion">>;

export type CreateLoteProductoPayload = {
  codigoLoteProducto: string;
  productoId: number;
  cosechaId?: number | null;
  loteCultivoId?: number | null;
  geneticaId?: number | null;
  ubicacionStockId?: number | null;
  fechaIngreso?: string;
  fechaVencimiento?: string | null;
  cantidadInicial: number;
  cantidadDisponible: number;
  cantidadReservada?: number;
  unidadMedida?: UnidadMedida;
  estado?: EstadoLote;
  observaciones?: string | null;
};

export type UpdateLoteProductoPayload = Partial<Omit<CreateLoteProductoPayload, "codigoLoteProducto" | "productoId">>;
