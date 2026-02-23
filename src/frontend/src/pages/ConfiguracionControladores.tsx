import { useState, memo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useObtenerControladoresActivos, useAgregarControlador, useModificarControlador, useEliminarControlador } from '../hooks/useQueries';
import { Settings, Plus, Edit, Trash2, Loader2, UserCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Controlador } from '../backend';

export default function ConfiguracionControladores() {
  const { data: controladores, isLoading } = useObtenerControladoresActivos();
  const [dialogAgregarAbierto, setDialogAgregarAbierto] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full py-3 sm:py-4 md:py-6 lg:py-8 px-2 sm:px-3 md:px-4">
          <div className="space-y-3 sm:space-y-4">
            <Skeleton className="h-20 sm:h-24 md:h-32 w-full" />
            <Skeleton className="h-40 sm:h-48 md:h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="w-full py-3 sm:py-4 md:py-6 lg:py-8 px-2 sm:px-3 md:px-4">
        <div className="mb-3 sm:mb-4 md:mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-black">Configuración de Controladores</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Administre los controladores responsables del control de calidad</p>
        </div>

        <Card className="mb-3 sm:mb-4 md:mb-6 bg-white border-gray-200">
          <CardHeader className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg text-black">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">Controladores Activos</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600 mt-1">
                  {controladores?.length || 0} {controladores?.length === 1 ? 'controlador registrado' : 'controladores registrados'}
                </CardDescription>
              </div>
              <Dialog open={dialogAgregarAbierto} onOpenChange={setDialogAgregarAbierto}>
                <DialogTrigger asChild>
                  <Button className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10 w-full sm:w-auto flex-shrink-0">
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Agregar Controlador</span>
                    <span className="xs:hidden">Agregar</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border-gray-300 max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <FormularioControlador 
                    onSuccess={() => setDialogAgregarAbierto(false)} 
                    controladoresExistentes={controladores || []}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
            {!controladores || controladores.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 md:py-12 text-center">
                <UserCheck className="mb-3 sm:mb-4 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400" />
                <p className="text-xs sm:text-sm text-gray-600 px-4">
                  No hay controladores registrados aún.
                  <br />
                  Agregue el primer controlador para comenzar.
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {controladores.map((controlador) => (
                  <ControladorCard 
                    key={controlador.id} 
                    controlador={controlador} 
                    controladoresExistentes={controladores}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const ControladorCard = memo(function ControladorCard({ 
  controlador, 
  controladoresExistentes 
}: { 
  controlador: Controlador;
  controladoresExistentes: Controlador[];
}) {
  const [dialogEditarAbierto, setDialogEditarAbierto] = useState(false);
  const eliminarMutation = useEliminarControlador();

  const handleEliminar = useCallback(async () => {
    try {
      await eliminarMutation.mutateAsync(controlador.id);
      toast.success('Controlador eliminado correctamente');
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al eliminar el controlador';
      toast.error(errorMessage);
    }
  }, [eliminarMutation, controlador.id]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 rounded-lg border border-gray-200 p-2.5 sm:p-3 md:p-4 bg-white">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <UserCheck className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm sm:text-base text-black truncate">{controlador.nombre}</p>
          <p className="text-xs sm:text-sm text-gray-600">Controlador de calidad</p>
        </div>
      </div>
      <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
        <Dialog open={dialogEditarAbierto} onOpenChange={setDialogEditarAbierto}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9 flex-1 sm:flex-initial">
              <Edit className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Editar</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-gray-300 max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <FormularioControlador
              controlador={controlador}
              onSuccess={() => setDialogEditarAbierto(false)}
              controladoresExistentes={controladoresExistentes}
            />
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9 text-destructive hover:bg-destructive hover:text-destructive-foreground flex-1 sm:flex-initial">
              <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Eliminar</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-white border-gray-300 max-w-[95vw] sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm sm:text-base text-black">¿Está seguro?</AlertDialogTitle>
              <AlertDialogDescription className="text-xs sm:text-sm text-gray-600">
                Esta acción desactivará el controlador "{controlador.nombre}". Los controles existentes asociados a este controlador se mantendrán, pero no podrá crear nuevos controles con este controlador.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="text-xs sm:text-sm h-9 w-full sm:w-auto">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleEliminar}
                disabled={eliminarMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs sm:text-sm h-9 w-full sm:w-auto"
              >
                {eliminarMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
});

function FormularioControlador({
  controlador,
  onSuccess,
  controladoresExistentes,
}: {
  controlador?: Controlador;
  onSuccess: () => void;
  controladoresExistentes: Controlador[];
}) {
  const [nombre, setNombre] = useState(controlador?.nombre || '');

  const agregarMutation = useAgregarControlador();
  const modificarMutation = useModificarControlador();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const nombreTrimmed = nombre.trim();

    if (!nombreTrimmed) {
      toast.error('Por favor ingrese un nombre');
      return;
    }

    // Frontend validation: check for active duplicates with exact match (case-sensitive)
    const existeDuplicado = controladoresExistentes.some(
      ctrl => ctrl.nombre === nombreTrimmed && ctrl.id !== controlador?.id
    );

    if (existeDuplicado) {
      toast.error('Ya existe un controlador activo con este nombre');
      return;
    }

    try {
      if (controlador) {
        await modificarMutation.mutateAsync({
          id: controlador.id,
          nuevoNombre: nombreTrimmed,
        });
        toast.success('Controlador modificado correctamente', {
          description: `El controlador "${nombreTrimmed}" ha sido actualizado`,
        });
      } else {
        await agregarMutation.mutateAsync(nombreTrimmed);
        toast.success('Controlador agregado correctamente', {
          description: `El controlador "${nombreTrimmed}" está listo para usar`,
        });
      }
      onSuccess();
    } catch (error: any) {
      // Extract error message from backend trap
      let errorMessage = 'Error al guardar el controlador';
      
      if (error?.message) {
        // Check if it's a backend trap message
        if (error.message.includes('Ya existe un controlador activo con este nombre')) {
          errorMessage = 'Ya existe un controlador activo con este nombre';
        } else if (error.message.includes('Controlador no encontrado')) {
          errorMessage = 'El controlador no fue encontrado';
        } else if (error.message.includes('No autorizado')) {
          errorMessage = 'No tiene permisos para realizar esta acción';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage, {
        description: 'Por favor intente nuevamente o contacte al administrador',
      });
    }
  }, [nombre, controlador, agregarMutation, modificarMutation, onSuccess, controladoresExistentes]);

  const isPending = agregarMutation.isPending || modificarMutation.isPending;

  return (
    <ScrollArea className="max-h-[calc(90vh-8rem)]">
      <div className="px-1">
        <DialogHeader className="px-2 sm:px-0">
          <DialogTitle className="text-sm sm:text-base md:text-lg text-black">{controlador ? 'Editar Controlador' : 'Agregar Nuevo Controlador'}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-gray-600">
            {controlador
              ? 'Modifique el nombre del controlador'
              : 'Ingrese el nombre del controlador responsable del control de calidad'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 px-2 sm:px-0 mt-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="nombre" className="text-xs sm:text-sm text-black">Nombre del Controlador</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez, María González, etc."
              required
              disabled={isPending}
              className="bg-white border-gray-300 text-black h-10 text-sm"
              maxLength={100}
            />
            <p className="text-[10px] sm:text-xs text-gray-600">
              Ingrese el nombre completo del controlador
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-2.5 sm:p-3 bg-white">
            <p className="mb-2 text-xs sm:text-sm font-medium text-black">Vista previa:</p>
            <div className="flex items-center gap-2 sm:gap-3">
              <UserCheck className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm sm:text-base text-black truncate">{nombre || 'Nombre del Controlador'}</p>
                <p className="text-xs sm:text-sm text-gray-600">Controlador de calidad</p>
              </div>
            </div>
          </div>

          <DialogFooter className="px-2 sm:px-0">
            <Button type="submit" disabled={isPending} className="w-full text-xs sm:text-sm h-10">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>{controlador ? 'Guardar Cambios' : 'Agregar Controlador'}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </div>
    </ScrollArea>
  );
}
