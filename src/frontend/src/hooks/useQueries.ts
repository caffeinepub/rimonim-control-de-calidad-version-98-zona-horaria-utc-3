import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { ControlCalidad, ControlCalidadConControlador, Filtro, DefectoCantidad, Empacador, Controlador, MuestraPlanilla, UserProfile, UserRole, UserWithRole } from '../backend';
import { ExternalBlob } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';
import { dateStringToTimestampUTC3 } from '../lib/utc3';

export function useObtenerProximoIdentificador() {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: ['proximo-identificador'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor no disponible');
      return await actor.obtenerProximoIdentificador();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useRegistrarControl() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      defectos,
      foto,
      cantidadMuestras,
      empacadorId,
      controladorId,
      dentroRangoPeso,
    }: {
      defectos: DefectoCantidad[];
      foto: File | null;
      cantidadMuestras: number;
      empacadorId: string;
      controladorId: string;
      dentroRangoPeso: boolean;
    }) => {
      if (!actor) throw new Error('Actor no disponible');
      
      let externalBlob: ExternalBlob | null = null;
      
      if (foto) {
        const bytes = new Uint8Array(await foto.arrayBuffer());
        externalBlob = ExternalBlob.fromBytes(bytes);
      }
      
      const id = await actor.registrarControl(
        defectos, 
        externalBlob, 
        BigInt(cantidadMuestras), 
        empacadorId,
        controladorId,
        dentroRangoPeso
      );

      const control = await actor.obtenerControl(id);
      const sampleTime = control ? control.lote : '00:00:00';
      const fecha = control ? Number(control.fecha) : Math.floor(Date.now() / 1000);
      
      return { id, sampleTime, fecha };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proximo-identificador'] });
      queryClient.invalidateQueries({ queryKey: ['historial'] });
      queryClient.invalidateQueries({ queryKey: ['controles-filtrados'] });
      queryClient.invalidateQueries({ queryKey: ['reporte-diario'] });
      queryClient.invalidateQueries({ queryKey: ['reportes-rango'] });
      queryClient.invalidateQueries({ queryKey: ['muestras-planilla'] });
    },
  });
}

export function useEliminarControl() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor no disponible');
      return await actor.eliminarControl(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proximo-identificador'] });
      queryClient.invalidateQueries({ queryKey: ['historial'] });
      queryClient.invalidateQueries({ queryKey: ['controles-filtrados'] });
      queryClient.invalidateQueries({ queryKey: ['reporte-diario'] });
      queryClient.invalidateQueries({ queryKey: ['reportes-rango'] });
      queryClient.invalidateQueries({ queryKey: ['muestras-planilla'] });
      queryClient.invalidateQueries({ queryKey: ['control'] });
      queryClient.invalidateQueries({ queryKey: ['detalle-muestra'] });
    },
  });
}

export function useObtenerHistorial() {
  const { actor, isFetching } = useActor();

  return useQuery<ControlCalidadConControlador[]>({
    queryKey: ['historial'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor no disponible');
      const controles = await actor.obtenerHistorial(BigInt(0), BigInt(10000), null, null);
      
      return controles.sort((a, b) => {
        const fechaDiff = Number(b.control.fecha) - Number(a.control.fecha);
        if (fechaDiff !== 0) return fechaDiff;
        return a.control.lote.localeCompare(b.control.lote);
      });
    },
    enabled: !!actor && !isFetching,
  });
}

export function useObtenerControlesFiltrados(filtro: Filtro) {
  const { actor, isFetching } = useActor();

  return useQuery<ControlCalidadConControlador[]>({
    queryKey: ['controles-filtrados', filtro],
    queryFn: async () => {
      if (!actor) throw new Error('Actor no disponible');
      const controles = await actor.obtenerControlesFiltrados(filtro);
      
      return controles.sort((a, b) => {
        const fechaDiff = Number(b.control.fecha) - Number(a.control.fecha);
        if (fechaDiff !== 0) return fechaDiff;
        return a.control.lote.localeCompare(b.control.lote);
      });
    },
    enabled: !!actor && !isFetching,
  });
}

export function useObtenerControl(id: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ControlCalidad | null>({
    queryKey: ['control', id],
    queryFn: async () => {
      if (!actor) throw new Error('Actor no disponible');
      return await actor.obtenerControl(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useObtenerMuestrasParaPlanilla(fechaInicio: string, fechaFin: string) {
  const { actor, isFetching } = useActor();

  return useQuery<MuestraPlanilla[]>({
    queryKey: ['muestras-planilla', fechaInicio, fechaFin],
    queryFn: async () => {
      if (!actor) throw new Error('Actor no disponible');
      const fechaInicioSeconds = dateStringToTimestampUTC3(fechaInicio);
      const fechaFinSeconds = dateStringToTimestampUTC3(fechaFin);
      const muestras = await actor.obtenerMuestrasParaPlanilla(fechaInicioSeconds, fechaFinSeconds);
      
      return muestras.sort((a, b) => {
        const fechaDiff = Number(b.fecha) - Number(a.fecha);
        if (fechaDiff !== 0) return fechaDiff;
        return a.lote.localeCompare(b.lote);
      });
    },
    enabled: !!actor && !isFetching && !!fechaInicio && !!fechaFin,
  });
}

export function useObtenerDetalleMuestra(id: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<MuestraPlanilla | null>({
    queryKey: ['detalle-muestra', id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return await actor.obtenerDetalleMuestra(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useObtenerReporteDiario(fecha: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['reporte-diario', fecha],
    queryFn: async () => {
      if (!actor) throw new Error('Actor no disponible');
      const fechaSeconds = dateStringToTimestampUTC3(fecha);
      return await actor.obtenerReporteDiario(fechaSeconds);
    },
    enabled: !!actor && !isFetching && !!fecha,
  });
}

export function useObtenerReporteRango(fechaInicio: string, fechaFin: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['reporte-rango', fechaInicio, fechaFin],
    queryFn: async () => {
      if (!actor) throw new Error('Actor no disponible');
      const fechaInicioSeconds = dateStringToTimestampUTC3(fechaInicio);
      const fechaFinSeconds = dateStringToTimestampUTC3(fechaFin);
      return await actor.obtenerReporteRango(fechaInicioSeconds, fechaFinSeconds);
    },
    enabled: !!actor && !isFetching && !!fechaInicio && !!fechaFin,
  });
}

export function useObtenerReportesPorRango(fechaInicio: string, fechaFin: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['reportes-rango', fechaInicio, fechaFin],
    queryFn: async () => {
      if (!actor) throw new Error('Actor no disponible');
      const fechaInicioSeconds = dateStringToTimestampUTC3(fechaInicio);
      const fechaFinSeconds = dateStringToTimestampUTC3(fechaFin);
      return await actor.obtenerReportesPorRango(fechaInicioSeconds, fechaFinSeconds);
    },
    enabled: !!actor && !isFetching && !!fechaInicio && !!fechaFin,
  });
}

export function useObtenerEmpacadoresActivos() {
  const { actor, isFetching } = useActor();

  return useQuery<Empacador[]>({
    queryKey: ['empacadores-activos'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor no disponible');
      return await actor.obtenerEmpacadoresActivos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAgregarEmpacador() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ identificador, color }: { identificador: string; color: string }) => {
      if (!actor) throw new Error('Actor no disponible');
      return await actor.agregarEmpacador(identificador, color);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empacadores-activos'] });
    },
  });
}

export function useModificarEmpacador() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nuevoIdentificador, nuevoColor }: { id: string; nuevoIdentificador: string; nuevoColor: string }) => {
      if (!actor) throw new Error('Actor no disponible');
      return await actor.modificarEmpacador(id, nuevoIdentificador, nuevoColor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empacadores-activos'] });
    },
  });
}

export function useEliminarEmpacador() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor no disponible');
      return await actor.eliminarEmpacador(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empacadores-activos'] });
    },
  });
}

export function useObtenerControladoresActivos() {
  const { actor, isFetching } = useActor();

  return useQuery<Controlador[]>({
    queryKey: ['controladores-activos'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor no disponible');
      return await actor.obtenerControladoresActivos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAgregarControlador() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nombre: string) => {
      if (!actor) throw new Error('Actor no disponible');
      return await actor.agregarControlador(nombre);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controladores-activos'] });
    },
  });
}

export function useModificarControlador() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nuevoNombre }: { id: string; nuevoNombre: string }) => {
      if (!actor) throw new Error('Actor no disponible');
      return await actor.modificarControlador(id, nuevoNombre);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controladores-activos'] });
    },
  });
}

export function useEliminarControlador() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor no disponible');
      return await actor.eliminarControlador(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['controladores-activos'] });
    },
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useGetAllUserRoles() {
  const { actor, isFetching } = useActor();

  return useQuery<UserWithRole[]>({
    queryKey: ['allUserRoles'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllUserRoles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignCallerUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserRoles'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserRole'] });
    },
  });
}
