import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useObtenerHistorial, useEliminarControl, useObtenerEmpacadoresActivos, useObtenerControladoresActivos } from '../hooks/useQueries';
import { Defecto, UserRole } from '../backend';
import { History, Trash2, Eye, Calendar, Package, AlertCircle, Search, UserCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateUTC3 } from '../lib/utc3';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const DEFECTO_LABELS: Record<Defecto, string> = {
  [Defecto.raset]: 'Raset',
  [Defecto.cracking]: 'Cracking',
  [Defecto.golpeSol]: 'Golpe de sol',
  [Defecto.podredumbre]: 'Podredumbre',
};

interface HistorialProps {
  userRole?: UserRole;
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  });

  return debouncedValue;
}

export default function Historial({ userRole }: HistorialProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { data: controles, isLoading, error } = useObtenerHistorial();
  const { data: empacadores } = useObtenerEmpacadoresActivos();
  const { data: controladores } = useObtenerControladoresActivos();
  const eliminarMutation = useEliminarControl();

  const isAdmin = userRole === UserRole.admin;

  // Helper to get empacador info
  const getEmpacadorInfo = (empacadorId: string) => {
    const empacador = empacadores?.find(e => e.id === empacadorId);
    if (empacador) return empacador;
    
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

  // Filter controls based on debounced search term
  const controlesFiltrados = useMemo(() => {
    if (!controles) return [];
    if (!debouncedSearchTerm.trim()) return controles;

    const searchLower = debouncedSearchTerm.toLowerCase().trim();
    
    return controles.filter(c => {
      const empacadorInfo = getEmpacadorInfo(c.control.empacadorId);
      const controladorNombre = getControladorNombre(c.control.controladorId);
      const fechaStr = formatDateUTC3(c.control.fecha);
      
      return (
        c.control.lote.toLowerCase().includes(searchLower) ||
        empacadorInfo.identificador.toLowerCase().includes(searchLower) ||
        controladorNombre.toLowerCase().includes(searchLower) ||
        fechaStr.includes(searchLower) ||
        c.control.cantidadMuestras.toString().includes(searchLower)
      );
    });
  }, [controles, debouncedSearchTerm, empacadores, controladores]);

  const handleEliminar = async (id: string) => {
    try {
      await eliminarMutation.mutateAsync(id);
      toast.success('Control eliminado correctamente');
    } catch (error: any) {
      console.error('Error eliminando control:', error);
      toast.error(error?.message || 'Error al eliminar el control');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full py-4 sm:py-6 md:py-8 px-3 sm:px-4">
          <div className="space-y-4 sm:space-y-6">
            <Skeleton className="h-24 sm:h-32 w-full" />
            <Skeleton className="h-64 sm:h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="w-full py-4 sm:py-6 md:py-8 px-3 sm:px-4">
          <Card className="bg-white border-red-200">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
              <AlertCircle className="mb-4 h-10 w-10 sm:h-12 sm:w-12 text-red-500" />
              <p className="text-center text-sm text-red-600 font-medium">
                Error al cargar el historial
              </p>
              <p className="text-center text-xs text-gray-600 mt-2">
                Por favor, intente nuevamente más tarde
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="w-full py-4 sm:py-6 md:py-8 px-3 sm:px-4">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-black flex items-center gap-2">
            <History className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
            Historial de Controles
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Registro completo de todas las muestras de calidad • Zona horaria: UTC-3
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-4 sm:mb-6 bg-white border-gray-200">
          <CardHeader className="px-3 sm:px-4 md:px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-black">
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              Buscar
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600">
              Busque por identificador, empacador, controlador, fecha o cantidad de muestras
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 md:px-6 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar en historial..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-black placeholder:text-gray-400"
              />
            </div>
            {searchTerm && (
              <p className="text-xs text-gray-600 mt-2">
                Mostrando {controlesFiltrados.length} de {controles?.length || 0} registros
              </p>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-white border-gray-200">
          <CardHeader className="px-3 sm:px-4 md:px-6 py-4 sm:py-5">
            <CardTitle className="text-base sm:text-lg text-black">
              Registros ({controlesFiltrados.length})
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600">
              Todos los controles de calidad registrados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-2 md:px-4 pb-4 sm:pb-6">
            {controlesFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <History className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-4" />
                <p className="text-center text-sm text-gray-600 font-medium">
                  {searchTerm ? 'No se encontraron resultados' : 'No hay controles registrados'}
                </p>
                <p className="text-center text-xs text-gray-500 mt-2">
                  {searchTerm ? 'Intente con otros términos de búsqueda' : 'Los controles aparecerán aquí una vez registrados'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="text-black font-semibold text-xs sm:text-sm whitespace-nowrap">Identificador</TableHead>
                      <TableHead className="text-black font-semibold text-xs sm:text-sm whitespace-nowrap">Fecha</TableHead>
                      <TableHead className="text-black font-semibold text-xs sm:text-sm whitespace-nowrap">Empacador</TableHead>
                      <TableHead className="text-black font-semibold text-xs sm:text-sm whitespace-nowrap">Controlador</TableHead>
                      <TableHead className="text-black font-semibold text-xs sm:text-sm whitespace-nowrap">Muestras</TableHead>
                      <TableHead className="text-black font-semibold text-xs sm:text-sm whitespace-nowrap">Defectos</TableHead>
                      <TableHead className="text-black font-semibold text-xs sm:text-sm whitespace-nowrap">Peso</TableHead>
                      <TableHead className="text-black font-semibold text-xs sm:text-sm whitespace-nowrap">Foto</TableHead>
                      {isAdmin && <TableHead className="text-black font-semibold text-xs sm:text-sm whitespace-nowrap">Acciones</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {controlesFiltrados.map((item) => {
                      const empacadorInfo = getEmpacadorInfo(item.control.empacadorId);
                      const controladorNombre = getControladorNombre(item.control.controladorId);
                      
                      return (
                        <TableRow key={item.control.id} className="hover:bg-gray-50">
                          <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">
                            {item.control.lote}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                            {formatDateUTC3(item.control.fecha)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge 
                              style={{ 
                                backgroundColor: empacadorInfo.color,
                                color: 'white',
                              }}
                              className="text-xs font-medium"
                            >
                              {empacadorInfo.identificador}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3 text-gray-500" />
                              {controladorNombre}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm text-center">
                            {item.control.cantidadMuestras.toString()}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <div className="flex flex-wrap gap-1">
                              {item.control.defectos && item.control.defectos.length > 0 ? (
                                item.control.defectos
                                  .filter(d => d && d.cantidad && Number(d.cantidad) > 0)
                                  .map((defecto, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs whitespace-nowrap">
                                      {DEFECTO_LABELS[defecto.defecto]}: {defecto.cantidad.toString()}
                                    </Badge>
                                  ))
                              ) : (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  Sin defectos
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm">
                            <Badge 
                              variant={item.control.dentroRangoPeso ? "default" : "destructive"}
                              className="text-xs whitespace-nowrap"
                            >
                              {item.control.dentroRangoPeso ? 'Dentro' : 'Fuera'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {item.control.foto ? (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => setSelectedImage(item.control.foto?.getDirectURL() || null)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Ver
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl bg-white">
                                  <DialogHeader>
                                    <DialogTitle className="text-black">Foto del Control - {item.control.lote}</DialogTitle>
                                  </DialogHeader>
                                  <div className="mt-4">
                                    {selectedImage && (
                                      <img
                                        src={selectedImage}
                                        alt={`Control ${item.control.lote}`}
                                        className="w-full h-auto rounded-lg"
                                        loading="lazy"
                                      />
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            ) : (
                              <span className="text-xs text-gray-400">Sin foto</span>
                            )}
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="text-xs"
                                    disabled={eliminarMutation.isPending}
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Eliminar
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-black">¿Está seguro?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-600">
                                      Esta acción no se puede deshacer. Se eliminará permanentemente el control {item.control.lote}.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-white text-black border-gray-300">
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleEliminar(item.control.id)}
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
