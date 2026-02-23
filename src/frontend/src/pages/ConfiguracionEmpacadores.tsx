import { useState, memo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useObtenerEmpacadoresActivos, useAgregarEmpacador, useModificarEmpacador, useEliminarEmpacador } from '../hooks/useQueries';
import { Settings, Plus, Edit, Trash2, Loader2, User, Palette } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Empacador } from '../backend';

const COLORES_PREDEFINIDOS = [
  { nombre: 'Rojo', valor: '#ef4444' },
  { nombre: 'Azul', valor: '#3b82f6' },
  { nombre: 'Verde', valor: '#22c55e' },
  { nombre: 'Amarillo', valor: '#eab308' },
  { nombre: 'Naranja', valor: '#f97316' },
  { nombre: 'Morado', valor: '#a855f7' },
  { nombre: 'Rosa', valor: '#ec4899' },
  { nombre: 'Café', valor: '#92400e' },
  { nombre: 'Turquesa', valor: '#14b8a6' },
  { nombre: 'Índigo', valor: '#6366f1' },
  { nombre: 'Lima', valor: '#84cc16' },
  { nombre: 'Cian', valor: '#06b6d4' },
];

export default function ConfiguracionEmpacadores() {
  const { data: empacadores, isLoading } = useObtenerEmpacadoresActivos();
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
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-black">Configuración de Empacadores</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Administre los empacadores y sus identificadores</p>
        </div>

        <Card className="mb-3 sm:mb-4 md:mb-6 bg-white border-gray-200">
          <CardHeader className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg text-black">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">Empacadores Activos</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600 mt-1">
                  {empacadores?.length || 0} {empacadores?.length === 1 ? 'empacador registrado' : 'empacadores registrados'}
                </CardDescription>
              </div>
              <Dialog open={dialogAgregarAbierto} onOpenChange={setDialogAgregarAbierto}>
                <DialogTrigger asChild>
                  <Button className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10 w-full sm:w-auto flex-shrink-0">
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Agregar Empacador</span>
                    <span className="xs:hidden">Agregar</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white border-gray-300 max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <FormularioEmpacador 
                    onSuccess={() => setDialogAgregarAbierto(false)} 
                    empacadoresExistentes={empacadores || []}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
            {!empacadores || empacadores.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 md:py-12 text-center">
                <User className="mb-3 sm:mb-4 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400" />
                <p className="text-xs sm:text-sm text-gray-600 px-4">
                  No hay empacadores registrados aún.
                  <br />
                  Agregue el primer empacador para comenzar.
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {empacadores.map((empacador) => (
                  <EmpacadorCard 
                    key={empacador.id} 
                    empacador={empacador} 
                    empacadoresExistentes={empacadores}
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

const EmpacadorCard = memo(function EmpacadorCard({ 
  empacador, 
  empacadoresExistentes 
}: { 
  empacador: Empacador;
  empacadoresExistentes: Empacador[];
}) {
  const [dialogEditarAbierto, setDialogEditarAbierto] = useState(false);
  const eliminarMutation = useEliminarEmpacador();

  const handleEliminar = useCallback(async () => {
    try {
      await eliminarMutation.mutateAsync(empacador.id);
      toast.success('Empacador eliminado correctamente');
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al eliminar el empacador';
      toast.error(errorMessage);
    }
  }, [eliminarMutation, empacador.id]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 rounded-lg border border-gray-200 p-2.5 sm:p-3 md:p-4 bg-white">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div
          className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0"
          style={{ backgroundColor: empacador.color }}
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm sm:text-base text-black truncate">{empacador.identificador}</p>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
            <Palette className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{empacador.color}</span>
          </div>
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
            <FormularioEmpacador
              empacador={empacador}
              onSuccess={() => setDialogEditarAbierto(false)}
              empacadoresExistentes={empacadoresExistentes}
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
                Esta acción desactivará el empacador "{empacador.identificador}". Los controles existentes asociados a este empacador se mantendrán, pero no podrá crear nuevos controles con este empacador.
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

function FormularioEmpacador({
  empacador,
  onSuccess,
  empacadoresExistentes,
}: {
  empacador?: Empacador;
  onSuccess: () => void;
  empacadoresExistentes: Empacador[];
}) {
  const [identificador, setIdentificador] = useState(empacador?.identificador || '');
  const [color, setColor] = useState(empacador?.color || COLORES_PREDEFINIDOS[0].valor);
  const [colorPersonalizado, setColorPersonalizado] = useState('');
  const [usarColorPersonalizado, setUsarColorPersonalizado] = useState(false);

  const agregarMutation = useAgregarEmpacador();
  const modificarMutation = useModificarEmpacador();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const identificadorTrimmed = identificador.trim();

    if (!identificadorTrimmed) {
      toast.error('Por favor ingrese un identificador');
      return;
    }

    // Frontend validation: check for active duplicates with exact match (case-sensitive)
    const existeDuplicado = empacadoresExistentes.some(
      emp => emp.identificador === identificadorTrimmed && emp.id !== empacador?.id
    );

    if (existeDuplicado) {
      toast.error('Ya existe un empacador activo con este identificador');
      return;
    }

    const colorFinal = usarColorPersonalizado && colorPersonalizado ? colorPersonalizado : color;

    // Validate color format
    if (!/^#[0-9A-Fa-f]{6}$/.test(colorFinal)) {
      toast.error('El color debe estar en formato hexadecimal válido (ej: #FF0000)');
      return;
    }

    try {
      if (empacador) {
        await modificarMutation.mutateAsync({
          id: empacador.id,
          nuevoIdentificador: identificadorTrimmed,
          nuevoColor: colorFinal,
        });
        toast.success('Empacador modificado correctamente', {
          description: `El empacador "${identificadorTrimmed}" ha sido actualizado`,
        });
      } else {
        await agregarMutation.mutateAsync({
          identificador: identificadorTrimmed,
          color: colorFinal,
        });
        toast.success('Empacador agregado correctamente', {
          description: `El empacador "${identificadorTrimmed}" está listo para usar`,
        });
      }
      onSuccess();
    } catch (error: any) {
      // Extract error message from backend trap
      let errorMessage = 'Error al guardar el empacador';
      
      if (error?.message) {
        // Check if it's a backend trap message
        if (error.message.includes('Ya existe un empacador activo con este identificador')) {
          errorMessage = 'Ya existe un empacador activo con este identificador';
        } else if (error.message.includes('Empacador no encontrado')) {
          errorMessage = 'El empacador no fue encontrado';
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
  }, [identificador, color, colorPersonalizado, usarColorPersonalizado, empacador, agregarMutation, modificarMutation, onSuccess, empacadoresExistentes]);

  const isPending = agregarMutation.isPending || modificarMutation.isPending;

  return (
    <ScrollArea className="max-h-[calc(90vh-8rem)]">
      <div className="px-1">
        <DialogHeader className="px-2 sm:px-0">
          <DialogTitle className="text-sm sm:text-base md:text-lg text-black">{empacador ? 'Editar Empacador' : 'Agregar Nuevo Empacador'}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-gray-600">
            {empacador
              ? 'Modifique el identificador o color del empacador'
              : 'Ingrese el identificador (texto o número 1-20) y seleccione un color'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 px-2 sm:px-0 mt-4">
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="identificador" className="text-xs sm:text-sm text-black">Identificador del Empacador</Label>
            <Input
              id="identificador"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              placeholder="Ej: Juan, María, 1, 2, etc."
              required
              disabled={isPending}
              className="bg-white border-gray-300 text-black h-10 text-sm"
              maxLength={50}
            />
            <p className="text-[10px] sm:text-xs text-gray-600">
              Puede usar texto o números del 1 al 20
            </p>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <Label className="text-xs sm:text-sm text-black">Color del Empacador</Label>
            
            <div className="space-y-2">
              <p className="text-xs sm:text-sm text-gray-600">Colores predefinidos:</p>
              <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                {COLORES_PREDEFINIDOS.map((colorPred) => (
                  <button
                    key={colorPred.valor}
                    type="button"
                    onClick={() => {
                      setColor(colorPred.valor);
                      setUsarColorPersonalizado(false);
                    }}
                    disabled={isPending}
                    className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed ${
                      color === colorPred.valor && !usarColorPersonalizado
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: colorPred.valor }}
                    title={colorPred.nombre}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs sm:text-sm text-gray-600">O ingrese un color personalizado:</p>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={colorPersonalizado || color}
                  onChange={(e) => {
                    setColorPersonalizado(e.target.value);
                    setUsarColorPersonalizado(true);
                  }}
                  disabled={isPending}
                  className="h-10 w-14 sm:w-16 flex-shrink-0"
                />
                <Input
                  type="text"
                  value={colorPersonalizado || color}
                  onChange={(e) => {
                    setColorPersonalizado(e.target.value);
                    setUsarColorPersonalizado(true);
                  }}
                  placeholder="#000000"
                  disabled={isPending}
                  className="flex-1 bg-white border-gray-300 text-black h-10 text-sm"
                  maxLength={7}
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-2.5 sm:p-3 bg-white">
              <p className="mb-2 text-xs sm:text-sm font-medium text-black">Vista previa:</p>
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className="h-9 w-9 sm:h-10 sm:w-10 md:h-12 md:w-12 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0"
                  style={{ backgroundColor: usarColorPersonalizado && colorPersonalizado ? colorPersonalizado : color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm sm:text-base text-black truncate">{identificador || 'Identificador'}</p>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">
                    {usarColorPersonalizado && colorPersonalizado ? colorPersonalizado : color}
                  </p>
                </div>
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
                <>{empacador ? 'Guardar Cambios' : 'Agregar Empacador'}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </div>
    </ScrollArea>
  );
}
