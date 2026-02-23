import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useObtenerHistorial, useObtenerEmpacadoresActivos, useObtenerControladoresActivos, useEliminarControl } from '../hooks/useQueries';
import { Defecto, type ControlCalidadConControlador, UserRole } from '../backend';
import { Calendar, Filter, Image as ImageIcon, AlertCircle, X, Package, User, Trash2, Clock, Scale, UserCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { formatDateUTC3, dateStringToTimestampUTC3 } from '../lib/utc3';

const DEFECTO_LABELS: Record<Defecto, string> = {
  [Defecto.raset]: 'Raset',
  [Defecto.cracking]: 'Cracking',
  [Defecto.golpeSol]: 'Golpe de sol',
  [Defecto.podredumbre]: 'Podredumbre',
};

interface HistorialProps {
  userRole?: UserRole;
}

export default function Historial({ userRole }: HistorialProps) {
  const { data: controles, isLoading } = useObtenerHistorial();
  const { data: empacadores } = useObtenerEmpacadoresActivos();
  const { data: controladores } = useObtenerControladoresActivos();
  const [busqueda, setBusqueda] = useState('');
  const [filtroDefecto, setFiltroDefecto] = useState<Defecto | 'todos'>('todos');
  const [filtroEmpacadorId, setFiltroEmpacadorId] = useState<string>('todos');
  const [filtroControladorId, setFiltroControladorId] = useState<string>('todos');
  const [filtroRangoPeso, setFiltroRangoPeso] = useState<string>('todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Check if user can delete (only admin)
  const canDelete = userRole === UserRole.admin;

  // Get unique empacador IDs from all controls
  const empacadoresUnicos = useMemo(() => {
    if (!controles) return [];
    const ids = new Set(controles.map(c => c.control.empacadorId));
    return Array.from(ids).sort();
  }, [controles]);

  // Get unique controlador IDs from all controls
  const controladoresUnicos = useMemo(() => {
    if (!controles) return [];
    const ids = new Set(controles.map(c => c.control.controladorId));
    return Array.from(ids).sort();
  }, [controles]);

  // Helper to get empacador info
  const getEmpacadorInfo = (empacadorId: string) => {
    const empacador = empacadores?.find(e => e.id === empacadorId);
    if (empacador) return empacador;
    
    // Fallback for inactive or deleted empacadores
    return {
      id: empacadorId,
      identificador: empacadorId,
      color: '#6b7280',
      activo: false,
    };
  };

  // Helper to get controlador name
  const getControladorNombre = (controladorId: string) => {
    const controlador = controladores?.find(c => c.id === controladorId);
    return controlador?.nombre || 'Desconocido';
  };

  const controlesFiltrados = useMemo(() => {
    if (!controles) return [];

    return controles.filter((c) => {
      const control = c.control;
      
      // Filtro de búsqueda por identificador de tiempo de muestra
      if (busqueda) {
        const sampleTime = control.lote;
        if (!sampleTime.includes(busqueda)) {
          return false;
        }
      }

      // Filtro por defecto
      if (filtroDefecto !== 'todos' && !control.defectos.some(d => d.defecto === filtroDefecto)) {
        return false;
      }

      // Filtro por empacador
      if (filtroEmpacadorId !== 'todos' && control.empacadorId !== filtroEmpacadorId) {
        return false;
      }

      // Filtro por controlador
      if (filtroControladorId !== 'todos' && control.controladorId !== filtroControladorId) {
        return false;
      }

      // Filtro por rango de peso
      if (filtroRangoPeso !== 'todos') {
        const dentroRango = filtroRangoPeso === 'si';
        if (control.dentroRangoPeso !== dentroRango) {
          return false;
        }
      }

      // Filtro por fecha (UTC-3)
      const controlTimestamp = control.fecha;
      if (fechaInicio) {
        const inicioTimestamp = dateStringToTimestampUTC3(fechaInicio);
        if (controlTimestamp < inicioTimestamp) return false;
      }
      if (fechaFin) {
        const finTimestamp = dateStringToTimestampUTC3(fechaFin);
        const endOfDay = finTimestamp + BigInt(86399); // End of day
        if (controlTimestamp > endOfDay) return false;
      }

      return true;
    });
  }, [controles, busqueda, filtroDefecto, filtroEmpacadorId, filtroControladorId, filtroRangoPeso, fechaInicio, fechaFin]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroDefecto('todos');
    setFiltroEmpacadorId('todos');
    setFiltroControladorId('todos');
    setFiltroRangoPeso('todos');
    setFechaInicio('');
    setFechaFin('');
  };

  const hayFiltrosActivos =
    busqueda || filtroDefecto !== 'todos' || filtroEmpacadorId !== 'todos' || filtroControladorId !== 'todos' || filtroRangoPeso !== 'todos' || fechaInicio || fechaFin;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full py-3 sm:py-4 md:py-6 lg:py-8 px-2 sm:px-3 md:px-4">
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 sm:h-24 md:h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="w-full py-3 sm:py-4 md:py-6 lg:py-8 px-2 sm:px-3 md:px-4">
        <div className="mb-3 sm:mb-4 md:mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-black">Historial de Controles</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Consulte y filtre los controles de calidad registrados (variedad Wonderful) • Zona horaria: UTC-3</p>
        </div>

        {/* Filtros */}
        <Card className="mb-3 sm:mb-4 md:mb-6 bg-white border-gray-200">
          <CardHeader className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg text-black">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              Filtros
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600">
              <div className="flex items-start gap-1.5">
                <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Cada muestra recibe un identificador de tiempo único UTC-3 basado en la hora de registro (HH:MM:SS), único por día calendario</span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
            <div className="grid gap-2.5 sm:gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="busqueda" className="text-xs sm:text-sm text-black">Buscar por Identificador de Muestra (UTC-3)</Label>
                <Input
                  id="busqueda"
                  placeholder="Ej: 10:35:42, 14:20..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="bg-white border-gray-300 text-black h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="filtro-defecto" className="text-xs sm:text-sm text-black">Defecto</Label>
                <Select value={filtroDefecto} onValueChange={(value) => setFiltroDefecto(value as Defecto | 'todos')}>
                  <SelectTrigger id="filtro-defecto" className="bg-white border-gray-300 text-black h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value={Defecto.raset}>Raset</SelectItem>
                    <SelectItem value={Defecto.cracking}>Cracking</SelectItem>
                    <SelectItem value={Defecto.golpeSol}>Golpe de sol</SelectItem>
                    <SelectItem value={Defecto.podredumbre}>Podredumbre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="filtro-empacador" className="text-xs sm:text-sm text-black">Empacador</Label>
                <Select value={filtroEmpacadorId} onValueChange={setFiltroEmpacadorId}>
                  <SelectTrigger id="filtro-empacador" className="bg-white border-gray-300 text-black h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="todos">Todos</SelectItem>
                    {empacadoresUnicos.map((empacadorId) => {
                      const empacadorInfo = getEmpacadorInfo(empacadorId);
                      return (
                        <SelectItem key={empacadorId} value={empacadorId}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full border border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: empacadorInfo.color }}
                            />
                            <span className="truncate">{empacadorInfo.identificador}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="filtro-controlador" className="text-xs sm:text-sm text-black">Controlador</Label>
                <Select value={filtroControladorId} onValueChange={setFiltroControladorId}>
                  <SelectTrigger id="filtro-controlador" className="bg-white border-gray-300 text-black h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="todos">Todos</SelectItem>
                    {controladoresUnicos.map((controladorId) => {
                      const controladorNombre = getControladorNombre(controladorId);
                      return (
                        <SelectItem key={controladorId} value={controladorId}>
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{controladorNombre}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="filtro-rango-peso" className="text-xs sm:text-sm text-black">Rango de Peso</Label>
                <Select value={filtroRangoPeso} onValueChange={setFiltroRangoPeso}>
                  <SelectTrigger id="filtro-rango-peso" className="bg-white border-gray-300 text-black h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="si">
                      <div className="flex items-center gap-2">
                        <Scale className="h-3 w-3 text-green-600" />
                        <span>Sí</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="no">
                      <div className="flex items-center gap-2">
                        <Scale className="h-3 w-3 text-red-600" />
                        <span>No</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="fecha-inicio" className="text-xs sm:text-sm text-black">Fecha Inicio (UTC-3)</Label>
                <Input
                  id="fecha-inicio"
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="bg-white border-gray-300 text-black h-10 text-sm"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="fecha-fin" className="text-xs sm:text-sm text-black">Fecha Fin (UTC-3)</Label>
                <Input
                  id="fecha-fin"
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="bg-white border-gray-300 text-black h-10 text-sm"
                />
              </div>
            </div>

            {hayFiltrosActivos && (
              <div className="mt-3 sm:mt-4">
                <Button variant="outline" size="sm" onClick={limpiarFiltros} className="text-xs sm:text-sm h-8 sm:h-9">
                  <X className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                  Limpiar Filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultados */}
        {controlesFiltrados.length === 0 ? (
          <Card className="bg-white border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8 md:py-12 px-4">
              <AlertCircle className="mb-3 sm:mb-4 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400" />
              <p className="text-center text-xs sm:text-sm text-gray-600">
                {controles && controles.length > 0
                  ? 'No se encontraron controles con los filtros aplicados'
                  : 'No hay controles registrados aún'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
            <p className="text-xs sm:text-sm text-gray-600">
              Mostrando {controlesFiltrados.length} de {controles?.length || 0} controles
            </p>

            {controlesFiltrados.map((c) => (
              <ControlCard key={c.control.id} controlData={c} empacadores={empacadores} canDelete={canDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ControlCard({ 
  controlData, 
  empacadores,
  canDelete 
}: { 
  controlData: ControlCalidadConControlador; 
  empacadores?: Array<{ id: string; identificador: string; color: string; activo: boolean }>;
  canDelete: boolean;
}) {
  const eliminarControlMutation = useEliminarControl();
  const control = controlData.control;
  const controlador = controlData.controlador;
  const fechaFormateada = formatDateUTC3(control.fecha);

  const empacador = empacadores?.find(e => e.id === control.empacadorId);
  const empacadorInfo = empacador || {
    id: control.empacadorId,
    identificador: control.empacadorId,
    color: '#6b7280',
    activo: false,
  };

  const totalDefectos = control.defectos.reduce((sum, d) => sum + Number(d.cantidad), 0);
  const totalFrutas = Number(control.cantidadMuestras);
  const frutasSinDefectos = Math.max(0, totalFrutas - totalDefectos);
  const sampleTime = control.lote;

  const handleEliminar = async () => {
    try {
      await eliminarControlMutation.mutateAsync(control.id);
      toast.success('Muestra eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar la muestra:', error);
      toast.error('Error al eliminar la muestra');
    }
  };

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="space-y-1 min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl text-black break-words">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span className="font-bold">{sampleTime}</span>
              </CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                <span className="break-words">{fechaFormateada} (UTC-3)</span>
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20 text-[10px] sm:text-xs self-start sm:self-auto flex-shrink-0" variant="outline">
                🍎 Wonderful
              </Badge>
              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1.5 text-xs sm:text-sm h-8 sm:h-9 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      disabled={eliminarControlMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white border-gray-300">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-black">¿Seguro que deseas eliminar esta muestra?</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-600">
                        Esta acción no se puede deshacer. La muestra <strong>{sampleTime}</strong> del día <strong>{fechaFormateada}</strong> será eliminada permanentemente del sistema.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-white text-black border-gray-300 hover:bg-gray-50">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleEliminar}
                        className="bg-red-600 text-white hover:bg-red-700"
                        disabled={eliminarControlMutation.isPending}
                      >
                        {eliminarControlMutation.isPending ? 'Eliminando...' : 'Eliminar'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 md:px-6 pb-2.5 sm:pb-3 md:pb-4">
        <div className="grid gap-2.5 sm:gap-3 md:gap-4 lg:grid-cols-[1fr,auto]">
          <div className="space-y-2 sm:space-y-2.5">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
              <Package className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>
                <strong className="font-medium text-black">{totalFrutas}</strong> frutas revisadas
                {frutasSinDefectos > 0 && (
                  <span className="text-green-700 ml-1">
                    • <strong>{frutasSinDefectos}</strong> sin defectos
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                <div
                  className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0"
                  style={{ backgroundColor: empacadorInfo.color }}
                  title={empacadorInfo.identificador}
                />
                <span className="font-medium text-black truncate">{empacadorInfo.identificador}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
              <span className="text-gray-600">
                Controlador: <strong className="text-black">{controlador.nombre}</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Scale className={`h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 ${control.dentroRangoPeso ? 'text-green-600' : 'text-red-600'}`} />
              <span className="text-gray-600">
                Rango de peso: <strong className={control.dentroRangoPeso ? 'text-green-700' : 'text-red-700'}>
                  {control.dentroRangoPeso ? 'Sí' : 'No'}
                </strong>
              </span>
            </div>
            
            <div>
              <p className="mb-1.5 sm:mb-2 text-xs sm:text-sm font-medium text-black">
                Defectos Detectados ({totalDefectos} frutas afectadas):
              </p>
              <div className="flex flex-wrap gap-1 sm:gap-1.5">
                {control.defectos.length > 0 ? (
                  control.defectos.map((defectoCantidad, index) => (
                    <Badge key={index} variant="secondary" className="text-[10px] sm:text-xs">
                      {DEFECTO_LABELS[defectoCantidad.defecto]}: {Number(defectoCantidad.cantidad)}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline" className="text-[10px] sm:text-xs bg-green-50 text-green-700 border-green-200">
                    ✅ Sin defectos
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {control.foto ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 w-full lg:w-auto">
                  <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  Ver Foto
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-3xl bg-white border-gray-300">
                <DialogHeader>
                  <DialogTitle className="text-sm sm:text-base text-black break-words">
                    Foto - Muestra {sampleTime} ({fechaFormateada})
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh]">
                  <div className="mt-4">
                    <img
                      src={control.foto.getDirectURL()}
                      alt={`Foto de la muestra ${sampleTime}`}
                      className="w-full rounded-lg"
                    />
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          ) : (
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <ImageIcon className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Sin foto
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
