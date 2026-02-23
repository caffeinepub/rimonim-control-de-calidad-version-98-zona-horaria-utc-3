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
      if (!actor) return '00:00:00';
      try {
        return await actor.obtenerProximoIdentificador();
      } catch (error) {
        console.error('Error obteniendo próximo identificador:', error);
        return '00:00:00';
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    gcTime: 10000,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 5000,
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
    onSuccess: async () => {
      // Immediate invalidation and refetch for next identifier
      await queryClient.invalidateQueries({ queryKey: ['proximo-identificador'] });
      await queryClient.refetchQueries({ queryKey: ['proximo-identificador'], type: 'active' });
      
      // Invalidate all data queries
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
    onSuccess: async () => {
      // Immediate invalidation and refetch for next identifier
      await queryClient.invalidateQueries({ queryKey: ['proximo-identificador'] });
      await queryClient.refetchQueries({ queryKey: ['proximo-identificador'], type: 'active' });
      
      // Invalidate all data queries
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
      if (!actor) return [];
      try {
        const controles = await actor.obtenerHistorial(BigInt(0), BigInt(10000), null, null);
        
        // Sort by date descending, then by lote (time HH:MM:SS) ascending
        return controles.sort((a, b) => {
          const fechaDiff = Number(b.control.fecha) - Number(a.control.fecha);
          if (fechaDiff !== 0) return fechaDiff;
          
          // For same date, sort by time string (HH:MM:SS format)
          return a.control.lote.localeCompare(b.control.lote);
        });
      } catch (error) {
        console.error('Error obteniendo historial:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60000,
    gcTime: 600000,
  });
}

export function useObtenerControlesFiltrados(filtro: Filtro) {
  const { actor, isFetching } = useActor();

  return useQuery<ControlCalidadConControlador[]>({
    queryKey: ['controles-filtrados', filtro],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const controles = await actor.obtenerControlesFiltrados(filtro);
        
        return controles.sort((a, b) => {
          const fechaDiff = Number(b.control.fecha) - Number(a.control.fecha);
          if (fechaDiff !== 0) return fechaDiff;
          return a.control.lote.localeCompare(b.control.lote);
        });
      } catch (error) {
        console.error('Error obteniendo controles filtrados:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 60000,
    gcTime: 600000,
  });
}

export function useObtenerControl(id: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ControlCalidad | null>({
    queryKey: ['control', id],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.obtenerControl(id);
      } catch (error) {
        console.error('Error obteniendo control:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!id,
    staleTime: 120000,
    gcTime: 600000,
  });
}

export function useObtenerMuestrasParaPlanilla(fechaInicio: string, fechaFin: string) {
  const { actor, isFetching } = useActor();

  return useQuery<MuestraPlanilla[]>({
    queryKey: ['muestras-planilla', fechaInicio, fechaFin],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const fechaInicioSeconds = dateStringToTimestampUTC3(fechaInicio);
        const fechaFinSeconds = dateStringToTimestampUTC3(fechaFin);
        const muestras = await actor.obtenerMuestrasParaPlanilla(fechaInicioSeconds, fechaFinSeconds);
        
        return muestras.sort((a, b) => {
          const fechaDiff = Number(b.fecha) - Number(a.fecha);
          if (fechaDiff !== 0) return fechaDiff;
          return a.lote.localeCompare(b.lote);
        });
      } catch (error) {
        console.error('Error obteniendo muestras para planilla:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!fechaInicio && !!fechaFin,
    staleTime: 60000,
    gcTime: 600000,
  });
}

export function useObtenerDetalleMuestra(id: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<MuestraPlanilla | null>({
    queryKey: ['detalle-muestra', id],
    queryFn: async () => {
      if (!actor || !id) return null;
      try {
        return await actor.obtenerDetalleMuestra(id);
      } catch (error) {
        console.error('Error obteniendo detalle de muestra:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!id,
    staleTime: 120000,
    gcTime: 600000,
  });
}

export function useObtenerEmpacadoresActivos() {
  const { actor, isFetching } = useActor();

  return useQuery<Empacador[]>({
    queryKey: ['empacadores-activos'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const empacadores = await actor.obtenerEmpacadoresActivos();
        
        return empacadores.sort((a, b) => {
          const aNum = parseInt(a.identificador);
          const bNum = parseInt(b.identificador);
          
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          
          return a.identificador.localeCompare(b.identificador, 'es');
        });
      } catch (error) {
        console.error('Error obteniendo empacadores activos:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 300000,
    gcTime: 900000,
  });
}

export function useAgregarEmpacador() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ identificador, color }: { identificador: string; color: string }) => {
      if (!actor) throw new Error('Actor no disponible');
      
      try {
        const id = await actor.agregarEmpacador(identificador, color);
        return id;
      } catch (error: any) {
        if (error?.message) {
          throw new Error(error.message);
        }
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['empacadores-activos'] });
      await queryClient.refetchQueries({ queryKey: ['empacadores-activos'], type: 'active' });
    },
  });
}

export function useModificarEmpacador() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nuevoIdentificador, nuevoColor }: { id: string; nuevoIdentificador: string; nuevoColor: string }) => {
      if (!actor) throw new Error('Actor no disponible');
      
      try {
        const resultId = await actor.modificarEmpacador(id, nuevoIdentificador, nuevoColor);
        return resultId;
      } catch (error: any) {
        if (error?.message) {
          throw new Error(error.message);
        }
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['empacadores-activos'] });
      await queryClient.refetchQueries({ queryKey: ['empacadores-activos'], type: 'active' });
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['empacadores-activos'] });
      await queryClient.refetchQueries({ queryKey: ['empacadores-activos'], type: 'active' });
    },
  });
}

export function useObtenerControladoresActivos() {
  const { actor, isFetching } = useActor();

  return useQuery<Controlador[]>({
    queryKey: ['controladores-activos'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const controladores = await actor.obtenerControladoresActivos();
        return controladores.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
      } catch (error) {
        console.error('Error obteniendo controladores activos:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 300000,
    gcTime: 900000,
  });
}

export function useAgregarControlador() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (nombre: string) => {
      if (!actor) throw new Error('Actor no disponible');
      
      try {
        const id = await actor.agregarControlador(nombre);
        return id;
      } catch (error: any) {
        if (error?.message) {
          throw new Error(error.message);
        }
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['controladores-activos'] });
      await queryClient.refetchQueries({ queryKey: ['controladores-activos'], type: 'active' });
    },
  });
}

export function useModificarControlador() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, nuevoNombre }: { id: string; nuevoNombre: string }) => {
      if (!actor) throw new Error('Actor no disponible');
      
      try {
        const resultId = await actor.modificarControlador(id, nuevoNombre);
        return resultId;
      } catch (error: any) {
        if (error?.message) {
          throw new Error(error.message);
        }
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['controladores-activos'] });
      await queryClient.refetchQueries({ queryKey: ['controladores-activos'], type: 'active' });
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['controladores-activos'] });
      await queryClient.refetchQueries({ queryKey: ['controladores-activos'], type: 'active' });
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
    staleTime: 180000,
    gcTime: 600000,
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
      if (!actor) throw new Error('Actor no disponible');
      return await actor.saveCallerUserProfile(profile);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      await queryClient.refetchQueries({ queryKey: ['currentUserProfile'], type: 'active' });
    },
  });
}

export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserRole>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    staleTime: 180000,
    gcTime: 600000,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetAllUserRoles() {
  const { actor, isFetching } = useActor();

  return useQuery<UserWithRole[]>({
    queryKey: ['allUserRoles'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getAllUserRoles();
      } catch (error) {
        console.error('Error obteniendo roles de usuarios:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 120000,
    gcTime: 600000,
  });
}

export function useAssignUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error('Actor no disponible');
      return await actor.setUserRole(user, role);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['allUserRoles'] });
      await queryClient.refetchQueries({ queryKey: ['allUserRoles'], type: 'active' });
    },
  });
}
