import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Filtro {
    empacadorId?: string;
    fechaInicio?: bigint;
    defecto?: Defecto;
    fechaFin?: bigint;
    controladorId?: string;
    dentroRangoPeso?: boolean;
}
export interface ControlCalidadConControlador {
    control: ControlCalidad;
    controlador: Controlador;
}
export interface Empacador {
    id: string;
    activo: boolean;
    color: string;
    identificador: string;
}
export interface DefectoCantidad {
    defecto: Defecto;
    cantidad: bigint;
}
export interface ReporteDiarioConControlador {
    totalDefectosPorTipo: Array<[Defecto, bigint]>;
    porcentajeFueraRangoPeso: number;
    porcentajeDentroRangoPeso: number;
    porcentajeDefectos: number;
    totalFrutasAfectadas: bigint;
    totalFrutasSinDefectos: bigint;
    totalMuestras: bigint;
    controles: Array<ControlCalidadConControlador>;
    totalFueraRangoPeso: bigint;
    totalDentroRangoPeso: bigint;
    porcentajeSinDefectos: number;
    fecha: bigint;
}
export interface Controlador {
    id: string;
    activo: boolean;
    nombre: string;
}
export interface ControlCalidad {
    id: string;
    foto?: ExternalBlob;
    lote: string;
    empacadorId: string;
    cantidadMuestras: bigint;
    horaRegistro: string;
    controladorId: string;
    dentroRangoPeso: boolean;
    defectos: Array<DefectoCantidad>;
    fecha: bigint;
}
export interface MuestraPlanilla {
    id: string;
    controlador: Controlador;
    foto?: ExternalBlob;
    lote: string;
    cantidadMuestras: bigint;
    empacador: Empacador;
    horaRegistro: string;
    dentroRangoPeso: boolean;
    defectos: Array<DefectoCantidad>;
    fecha: bigint;
}
export interface ReporteRangoConControlador {
    totalDefectosPorTipo: Array<[Defecto, bigint]>;
    porcentajeFueraRangoPeso: number;
    porcentajeDentroRangoPeso: number;
    porcentajeDefectos: number;
    totalFrutasAfectadas: bigint;
    totalFrutasSinDefectos: bigint;
    totalMuestras: bigint;
    controles: Array<ControlCalidadConControlador>;
    fechaInicio: bigint;
    totalFueraRangoPeso: bigint;
    totalDentroRangoPeso: bigint;
    fechaFin: bigint;
    porcentajeSinDefectos: number;
}
export interface UserProfile {
    name: string;
}
export enum Defecto {
    podredumbre = "podredumbre",
    cracking = "cracking",
    raset = "raset",
    golpeSol = "golpeSol"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    agregarControlador(nombre: string): Promise<string>;
    agregarEmpacador(identificador: string, color: string): Promise<string>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    eliminarControl(id: string): Promise<string>;
    eliminarControlador(id: string): Promise<string>;
    eliminarEmpacador(id: string): Promise<string>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    modificarControlador(id: string, nuevoNombre: string): Promise<string>;
    modificarEmpacador(id: string, nuevoIdentificador: string, nuevoColor: string): Promise<string>;
    obtenerControl(id: string): Promise<ControlCalidad | null>;
    obtenerControladoresActivos(): Promise<Array<Controlador>>;
    obtenerControlesFiltrados(filtro: Filtro): Promise<Array<ControlCalidadConControlador>>;
    obtenerDetalleMuestra(id: string): Promise<MuestraPlanilla | null>;
    obtenerEmpacadoresActivos(): Promise<Array<Empacador>>;
    obtenerHistorial(): Promise<Array<ControlCalidadConControlador>>;
    obtenerIdentificadoresParaConvertir(): Promise<Array<[string, boolean]>>;
    obtenerMuestrasParaPlanilla(fechaInicio: bigint, fechaFin: bigint): Promise<Array<MuestraPlanilla>>;
    obtenerProximoIdentificador(): Promise<string>;
    obtenerReporteDiario(fecha: bigint): Promise<ReporteDiarioConControlador | null>;
    obtenerReporteRango(fechaInicio: bigint, fechaFin: bigint): Promise<ReporteRangoConControlador | null>;
    obtenerReportesPorRango(fechaInicio: bigint, fechaFin: bigint): Promise<Array<ReporteDiarioConControlador>>;
    registrarControl(defectos: Array<DefectoCantidad>, foto: ExternalBlob | null, cantidadMuestras: bigint, empacadorId: string, controladorId: string, dentroRangoPeso: boolean): Promise<string>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
