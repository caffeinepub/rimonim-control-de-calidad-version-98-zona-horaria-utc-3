import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useObtenerHistorial, useObtenerEmpacadoresActivos, useObtenerControladoresActivos } from '../hooks/useQueries';
import { Defecto, ControlCalidadConControlador } from '../backend';
import { FileText, TrendingUp, AlertCircle, Package, Users, Calendar, CalendarRange, CheckCircle, Clock, Filter, FilterX, Download, UserCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { formatDateUTC3, getTodayDateStringUTC3, isTimestampInDateRangeUTC3, isTimestampOnDateUTC3 } from '../lib/utc3';
import { generateDailyReportPDF } from '../lib/pdfGenerator';
import { toast } from 'sonner';

const DEFECTO_LABELS: Record<Defecto, string> = {
  [Defecto.raset]: 'Raset',
  [Defecto.cracking]: 'Cracking',
  [Defecto.golpeSol]: 'Golpe de sol',
  [Defecto.podredumbre]: 'Podredumbre',
};

const CHART_COLORS = ['oklch(0.646 0.222 41.116)', 'oklch(0.6 0.118 184.704)', 'oklch(0.398 0.07 227.392)', 'oklch(0.828 0.189 84.429)'];

export default function Reportes() {
  const [modoReporte, setModoReporte] = useState<'dia' | 'rango'>('dia');
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(getTodayDateStringUTC3());
  const [fechaInicio, setFechaInicio] = useState<string>(getTodayDateStringUTC3());
  const [fechaFin, setFechaFin] = useState<string>(getTodayDateStringUTC3());
  const [filtroDefecto, setFiltroDefecto] = useState<Defecto | 'todos'>('todos');
  const [filtroEmpacadorId, setFiltroEmpacadorId] = useState<string>('todos');
  const [filtroControladorId, setFiltroControladorId] = useState<string>('todos');
  const [filtroRangoPeso, setFiltroRangoPeso] = useState<'todos' | 'si' | 'no'>('todos');
  const [generatingPDF, setGeneratingPDF] = useState(false);

  // Fetch ALL history data directly - same as History page
  const { data: historialCompleto, isLoading, error } = useObtenerHistorial();
  const { data: empacadores } = useObtenerEmpacadoresActivos();
  const { data: controladores } = useObtenerControladoresActivos();

  // Get unique empacador IDs from all history for filter
  const empacadoresUnicos = useMemo(() => {
    if (!historialCompleto) return [];
    const ids = new Set(historialCompleto.map(c => c.control.empacadorId));
    return Array.from(ids).sort();
  }, [historialCompleto]);

  // Get unique controlador IDs from all history for filter
  const controladoresUnicos = useMemo(() => {
    if (!historialCompleto) return [];
    const ids = new Set(historialCompleto.map(c => c.control.controladorId));
    return Array.from(ids).sort();
  }, [historialCompleto]);

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

  // Check if any filter is active
  const hasActiveFilters = filtroDefecto !== 'todos' || filtroEmpacadorId !== 'todos' || filtroControladorId !== 'todos' || filtroRangoPeso !== 'todos';

  // Clear all filters
  const clearFilters = () => {
    setFiltroDefecto('todos');
    setFiltroEmpacadorId('todos');
    setFiltroControladorId('todos');
    setFiltroRangoPeso('todos');
  };

  // Apply filters to controls - for both display and calculations
  const aplicarFiltros = (controles: ControlCalidadConControlador[]): ControlCalidadConControlador[] => {
    if (!hasActiveFilters) return controles;

    let controlesFiltrados = controles;

    if (filtroDefecto !== 'todos') {
      controlesFiltrados = controlesFiltrados.filter(c => 
        c.control.defectos && Array.isArray(c.control.defectos) && c.control.defectos.some(d => d && d.defecto === filtroDefecto)
      );
    }

    if (filtroEmpacadorId !== 'todos') {
      controlesFiltrados = controlesFiltrados.filter(c => c.control.empacadorId === filtroEmpacadorId);
    }

    if (filtroControladorId !== 'todos') {
      controlesFiltrados = controlesFiltrados.filter(c => c.control.controladorId === filtroControladorId);
    }

    if (filtroRangoPeso !== 'todos') {
      const dentroRango = filtroRangoPeso === 'si';
      controlesFiltrados = controlesFiltrados.filter(c => c.control.dentroRangoPeso === dentroRango);
    }

    return controlesFiltrados;
  };

  // Filter controls by date/range - EXACTLY as stored in History (UTC-3)
  const todosControles = useMemo(() => {
    if (!historialCompleto) return [];

    if (modoReporte === 'dia') {
      // Filter by single day (UTC-3)
      return historialCompleto.filter(c => 
        isTimestampOnDateUTC3(c.control.fecha, fechaSeleccionada)
      );
    } else {
      // Filter by date range (UTC-3)
      return historialCompleto.filter(c => 
        isTimestampInDateRangeUTC3(c.control.fecha, fechaInicio, fechaFin)
      );
    }
  }, [historialCompleto, modoReporte, fechaSeleccionada, fechaInicio, fechaFin]);

  // Get filtered controls for display AND calculations
  const controlesFiltrados = useMemo(() => {
    return aplicarFiltros(todosControles);
  }, [todosControles, filtroDefecto, filtroEmpacadorId, filtroControladorId, filtroRangoPeso, hasActiveFilters]);

  // Group controls by date for range mode - using filtered controls
  const controlesPorFecha = useMemo(() => {
    if (modoReporte !== 'rango' || controlesFiltrados.length === 0) return [];

    const grupos = new Map<string, ControlCalidadConControlador[]>();
    
    controlesFiltrados.forEach(c => {
      const fechaKey = Number(c.control.fecha).toString();
      if (!grupos.has(fechaKey)) {
        grupos.set(fechaKey, []);
      }
      grupos.get(fechaKey)!.push(c);
    });

    // Convert to array and sort by date descending
    return Array.from(grupos.entries())
      .map(([fechaKey, controles]) => ({
        fecha: BigInt(fechaKey),
        controles: controles.sort((a, b) => {
          // Sort by lote (time HH:MM:SS) string comparison
          return a.control.lote.localeCompare(b.control.lote);
        })
      }))
      .sort((a, b) => Number(b.fecha) - Number(a.fecha));
  }, [modoReporte, controlesFiltrados]);

  // Calculate statistics from FILTERED controls
  const estadisticasTotales = useMemo(() => {
    if (controlesFiltrados.length === 0) return null;

    const controles = controlesFiltrados.map(c => c.control);
    const totalControles = controles.length;
    
    // Calculate total samples (fruits)
    const totalMuestras = controles.reduce((sum, c) => {
      const cantidad = c.cantidadMuestras ? Number(c.cantidadMuestras) : 0;
      return sum + cantidad;
    }, 0);

    // Count defects by type with proper null checks
    const defectosPorTipo: Record<Defecto, number> = {
      [Defecto.raset]: 0,
      [Defecto.cracking]: 0,
      [Defecto.golpeSol]: 0,
      [Defecto.podredumbre]: 0,
    };

    let totalFrutasConDefectos = 0;

    controles.forEach((control) => {
      if (control.defectos && Array.isArray(control.defectos)) {
        control.defectos.forEach((defectoCantidad) => {
          if (defectoCantidad && defectoCantidad.defecto && defectoCantidad.cantidad !== undefined && defectoCantidad.cantidad !== null) {
            const cantidad = Number(defectoCantidad.cantidad);
            if (!isNaN(cantidad) && cantidad > 0) {
              defectosPorTipo[defectoCantidad.defecto] = (defectosPorTipo[defectoCantidad.defecto] || 0) + cantidad;
              totalFrutasConDefectos += cantidad;
            }
          }
        });
      }
    });

    // Calculate fruits without defects
    const frutasSinDefectos = Math.max(0, totalMuestras - totalFrutasConDefectos);
    
    // Calculate percentages with proper null checks
    const porcentajeDefectos = totalMuestras > 0 
      ? ((totalFrutasConDefectos / totalMuestras) * 100).toFixed(1)
      : '0.0';
    
    const porcentajeSinDefectos = totalMuestras > 0 
      ? ((frutasSinDefectos / totalMuestras) * 100).toFixed(1)
      : '0.0';

    // Count by empacador
    const controlesPorEmpacador: Record<string, number> = {};
    controles.forEach((control) => {
      if (control.empacadorId) {
        const empacadorInfo = getEmpacadorInfo(control.empacadorId);
        const identificador = empacadorInfo.identificador;
        controlesPorEmpacador[identificador] = (controlesPorEmpacador[identificador] || 0) + 1;
      }
    });

    // Count by weight range
    const dentroRangoPesoCount = controles.filter(c => c.dentroRangoPeso).length;
    const fueraRangoPesoCount = controles.filter(c => !c.dentroRangoPeso).length;
    
    const porcentajeDentroRangoPeso = totalControles > 0 
      ? ((dentroRangoPesoCount / totalControles) * 100).toFixed(1)
      : '0.0';
    
    const porcentajeFueraRangoPeso = totalControles > 0 
      ? ((fueraRangoPesoCount / totalControles) * 100).toFixed(1)
      : '0.0';

    // Data for bar chart - only include defects with count > 0
    const datosBarras = Object.entries(defectosPorTipo)
      .filter(([, count]) => count > 0)
      .map(([defecto, count]) => ({
        defecto: DEFECTO_LABELS[defecto as Defecto],
        cantidad: count,
      }));

    // Unique empacadores
    const empacadoresUnicos = new Set(controles.map((c) => c.empacadorId)).size;

    // Unique days (for range)
    const diasUnicos = modoReporte === 'rango' ? controlesPorFecha.length : 1;

    return {
      totalControles,
      totalMuestras,
      totalFrutasConDefectos,
      frutasSinDefectos,
      porcentajeDefectos,
      porcentajeSinDefectos,
      empacadoresUnicos,
      diasUnicos,
      defectosPorTipo,
      controlesPorEmpacador,
      datosBarras,
      dentroRangoPesoCount,
      fueraRangoPesoCount,
      porcentajeDentroRangoPeso,
      porcentajeFueraRangoPeso,
    };
  }, [controlesFiltrados, modoReporte, controlesPorFecha, empacadores, getEmpacadorInfo]);

  // Handle PDF generation for current day
  const handleGeneratePDF = async () => {
    if (!todosControles || todosControles.length === 0) {
      toast.error('No hay datos para generar el PDF');
      return;
    }

    setGeneratingPDF(true);
    try {
      // Get today's date for the report
      const fechaReporte = modoReporte === 'dia' ? fechaSeleccionada : getTodayDateStringUTC3();
      
      // Filter controls for today only
      const controlesHoy = historialCompleto?.filter(c => 
        isTimestampOnDateUTC3(c.control.fecha, fechaReporte)
      ) || [];

      if (controlesHoy.length === 0) {
        toast.error('No hay datos del día actual para generar el PDF');
        setGeneratingPDF(false);
        return;
      }

      // Calculate statistics for today
      const totalMuestras = controlesHoy.reduce((sum, c) => sum + Number(c.control.cantidadMuestras || 0), 0);
      
      const defectosPorTipo: Record<Defecto, number> = {
        [Defecto.raset]: 0,
        [Defecto.cracking]: 0,
        [Defecto.golpeSol]: 0,
        [Defecto.podredumbre]: 0,
      };

      let totalFrutasAfectadas = 0;
      controlesHoy.forEach((c) => {
        if (c.control.defectos && Array.isArray(c.control.defectos)) {
          c.control.defectos.forEach((defecto) => {
            if (defecto && defecto.defecto && defecto.cantidad) {
              const cantidad = Number(defecto.cantidad);
              defectosPorTipo[defecto.defecto] += cantidad;
              totalFrutasAfectadas += cantidad;
            }
          });
        }
      });

      const totalFrutasSinDefectos = Math.max(0, totalMuestras - totalFrutasAfectadas);
      const porcentajeDefectos = totalMuestras > 0 ? ((totalFrutasAfectadas / totalMuestras) * 100).toFixed(1) : '0.0';
      const porcentajeSinDefectos = totalMuestras > 0 ? ((totalFrutasSinDefectos / totalMuestras) * 100).toFixed(1) : '0.0';

      const dentroRangoPesoCount = controlesHoy.filter(c => c.control.dentroRangoPeso).length;
      const fueraRangoPesoCount = controlesHoy.filter(c => !c.control.dentroRangoPeso).length;
      const porcentajeDentroRangoPeso = controlesHoy.length > 0 ? ((dentroRangoPesoCount / controlesHoy.length) * 100).toFixed(1) : '0.0';
      const porcentajeFueraRangoPeso = controlesHoy.length > 0 ? ((fueraRangoPesoCount / controlesHoy.length) * 100).toFixed(1) : '0.0';

      // Prepare controls with empacador and controlador info
      const controlesConInfo = controlesHoy.map(c => ({
        ...c.control,
        empacadorInfo: getEmpacadorInfo(c.control.empacadorId),
        controladorNombre: c.controlador.nombre,
      }));

      await generateDailyReportPDF({
        fecha: fechaReporte,
        controles: controlesConInfo,
        totalMuestras,
        totalFrutasAfectadas,
        totalFrutasSinDefectos,
        porcentajeDefectos,
        porcentajeSinDefectos,
        dentroRangoPesoCount,
        fueraRangoPesoCount,
        porcentajeDentroRangoPeso,
        porcentajeFueraRangoPeso,
        defectosPorTipo,
        defectoLabels: DEFECTO_LABELS,
      });

      toast.success('Ventana de impresión abierta. Use "Guardar como PDF" en el diálogo de impresión.');
    } catch (error) {
      console.error('Error generando PDF:', error);
      toast.error('Error al generar el PDF: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setGeneratingPDF(false);
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
                Error al cargar los reportes
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
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-black">Reportes y Estadísticas</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Análisis completo de todas las muestras registradas de variedad Wonderful • Zona horaria: UTC-3</p>
        </div>

        {/* PDF Generation Button - Prominent at the top */}
        {modoReporte === 'dia' && todosControles.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <Button
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-primary border-2 border-primary shadow-md hover:shadow-lg transition-all duration-200 font-semibold text-sm sm:text-base py-5 sm:py-6 px-6 sm:px-8 gap-3"
              size="lg"
            >
              <Download className="h-5 w-5 sm:h-6 sm:w-6" />
              {generatingPDF ? 'Generando PDF...' : 'Generar reporte PDF'}
            </Button>
            <p className="text-xs text-gray-600 mt-2 ml-1">
              📄 Genera un reporte PDF completo del día seleccionado con todas las estadísticas y detalles
            </p>
          </div>
        )}

        {/* Date Selection and Filters Section */}
        <Card className="mb-4 sm:mb-6 bg-white border-gray-200">
          <CardHeader className="px-3 sm:px-4 md:px-6 py-4 sm:py-5">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-black">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              Selección de Fecha (UTC-3)
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-gray-600">Elija un día específico o un rango de fechas para ver todas las muestras en zona horaria UTC-3</CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
            <Tabs value={modoReporte} onValueChange={(value) => setModoReporte(value as 'dia' | 'rango')} className="mb-4">
              <TabsList className="grid w-full grid-cols-2 h-auto">
                <TabsTrigger value="dia" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Día Específico</span>
                  <span className="xs:hidden">Día</span>
                </TabsTrigger>
                <TabsTrigger value="rango" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
                  <CalendarRange className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Rango de Fechas</span>
                  <span className="xs:hidden">Rango</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dia" className="mt-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha-selector" className="text-xs sm:text-sm text-black">Fecha del Reporte (UTC-3)</Label>
                  <Input
                    id="fecha-selector"
                    type="date"
                    value={fechaSeleccionada}
                    onChange={(e) => setFechaSeleccionada(e.target.value)}
                    className="w-full bg-white border-gray-300 text-black h-10 sm:h-10 text-sm"
                  />
                </div>
              </TabsContent>

              <TabsContent value="rango" className="mt-4">
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fecha-inicio" className="text-xs sm:text-sm text-black">Fecha de Inicio (UTC-3)</Label>
                    <Input
                      id="fecha-inicio"
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="bg-white border-gray-300 text-black h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha-fin" className="text-xs sm:text-sm text-black">Fecha de Fin (UTC-3)</Label>
                    <Input
                      id="fecha-fin"
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      min={fechaInicio}
                      className="bg-white border-gray-300 text-black h-10 text-sm"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-4 sm:my-6 bg-gray-200" />

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-600" />
                <Label className="text-xs sm:text-sm text-black font-semibold">Filtros Dinámicos</Label>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 text-xs gap-1"
                >
                  <FilterX className="h-3 w-3" />
                  Limpiar
                </Button>
              )}
            </div>

            {hasActiveFilters && (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-800">
                  ℹ️ Los filtros activos ocultan registros no coincidentes y actualizan todas las estadísticas y totales automáticamente.
                </p>
              </div>
            )}

            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="filtro-defecto" className="text-xs sm:text-sm text-black">Tipo de Defecto</Label>
                <Select value={filtroDefecto} onValueChange={(value) => setFiltroDefecto(value as Defecto | 'todos')}>
                  <SelectTrigger id="filtro-defecto" className="bg-white border-gray-300 text-black h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="todos">Todos los defectos</SelectItem>
                    <SelectItem value={Defecto.raset}>Raset</SelectItem>
                    <SelectItem value={Defecto.cracking}>Cracking</SelectItem>
                    <SelectItem value={Defecto.golpeSol}>Golpe de sol</SelectItem>
                    <SelectItem value={Defecto.podredumbre}>Podredumbre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filtro-empacador" className="text-xs sm:text-sm text-black">Empacador</Label>
                <Select value={filtroEmpacadorId} onValueChange={setFiltroEmpacadorId}>
                  <SelectTrigger id="filtro-empacador" className="bg-white border-gray-300 text-black h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="todos">Todos los empacadores</SelectItem>
                    {empacadoresUnicos.map((empacadorId) => {
                      const empacadorInfo = getEmpacadorInfo(empacadorId);
                      return (
                        <SelectItem key={empacadorId} value={empacadorId}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full border flex-shrink-0"
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

              <div className="space-y-2">
                <Label htmlFor="filtro-controlador" className="text-xs sm:text-sm text-black">Controlador</Label>
                <Select value={filtroControladorId} onValueChange={setFiltroControladorId}>
                  <SelectTrigger id="filtro-controlador" className="bg-white border-gray-300 text-black h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="todos">Todos los controladores</SelectItem>
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

              <div className="space-y-2">
                <Label htmlFor="filtro-rango-peso" className="text-xs sm:text-sm text-black">Rango de Peso</Label>
                <Select value={filtroRangoPeso} onValueChange={(value) => setFiltroRangoPeso(value as 'todos' | 'si' | 'no')}>
                  <SelectTrigger id="filtro-rango-peso" className="bg-white border-gray-300 text-black h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-300">
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="si">Dentro del rango (Sí)</SelectItem>
                    <SelectItem value="no">Fuera del rango (No)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        {todosControles.length === 0 ? (
          <Card className="bg-white border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
              <FileText className="mb-4 h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              <p className="text-center text-sm sm:text-base text-gray-700 font-medium mb-2">
                No hay datos disponibles
              </p>
              <p className="text-center text-xs sm:text-sm text-gray-600 max-w-md">
                No se encontraron registros para {modoReporte === 'dia' ? 'la fecha seleccionada' : 'el rango de fechas seleccionado'} en zona horaria UTC-3. Seleccione otra fecha o registre controles de calidad.
              </p>
            </CardContent>
          </Card>
        ) : controlesFiltrados.length === 0 ? (
          <Card className="bg-white border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
              <FilterX className="mb-4 h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
              <p className="text-center text-sm sm:text-base text-gray-700 font-medium mb-2">
                No hay registros que coincidan con los filtros
              </p>
              <p className="text-center text-xs sm:text-sm text-gray-600 max-w-md mb-4">
                Se encontraron {todosControles.length} {todosControles.length === 1 ? 'registro' : 'registros'} en el período seleccionado, pero ninguno coincide con los filtros aplicados.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="gap-2"
              >
                <FilterX className="h-4 w-4" />
                Limpiar Filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Date Header */}
            <div className="mb-4 sm:mb-6 rounded-lg border-2 border-primary/20 bg-primary/5 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {modoReporte === 'dia' ? (
                    <>
                      <h3 className="text-base sm:text-xl md:text-2xl font-bold text-primary break-words">
                        📅 {formatDateUTC3(controlesFiltrados[0].control.fecha)}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        🔢 {controlesFiltrados.length} {controlesFiltrados.length === 1 ? 'muestra' : 'muestras'} 
                        {hasActiveFilters && ` (de ${todosControles.length} totales)`} • 🍎 Variedad Wonderful • 🌐 UTC-3
                      </p>
                    </>
                  ) : controlesPorFecha.length > 0 ? (
                    <>
                      <h3 className="text-sm sm:text-lg md:text-xl font-bold text-primary break-words">
                        📅 {formatDateUTC3(controlesPorFecha[controlesPorFecha.length - 1].fecha)} - {formatDateUTC3(controlesPorFecha[0].fecha)}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {estadisticasTotales?.diasUnicos} {estadisticasTotales?.diasUnicos === 1 ? 'día' : 'días'} • 🔢 {controlesFiltrados.length} {controlesFiltrados.length === 1 ? 'muestra' : 'muestras'}
                        {hasActiveFilters && ` (de ${todosControles.length} totales)`} • 🍎 Variedad Wonderful • 🌐 UTC-3
                      </p>
                    </>
                  ) : null}
                </div>
                {modoReporte === 'dia' ? (
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                ) : (
                  <CalendarRange className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
                )}
              </div>
            </div>

            {/* Summary Cards - Show filtered statistics */}
            <div className="mb-6 sm:mb-8 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5">
              <Card className="bg-white border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-black">Total Muestras</CardTitle>
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="text-xl sm:text-2xl font-bold text-black">{estadisticasTotales?.totalControles || 0}</div>
                  <p className="text-[10px] sm:text-xs text-gray-600 truncate">
                    {hasActiveFilters ? 'Muestras filtradas' : 'Todas las muestras'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-black">Total Frutas</CardTitle>
                  <Package className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="text-xl sm:text-2xl font-bold text-black">{estadisticasTotales?.totalMuestras || 0}</div>
                  <p className="text-[10px] sm:text-xs text-gray-600">Frutas revisadas</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-black">Con Defectos</CardTitle>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="text-xl sm:text-2xl font-bold text-black">{estadisticasTotales?.totalFrutasConDefectos || 0}</div>
                  <p className="text-[10px] sm:text-xs text-gray-600">Frutas afectadas</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-black">Empacadores</CardTitle>
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="text-xl sm:text-2xl font-bold text-black">{estadisticasTotales?.empacadoresUnicos || 0}</div>
                  <p className="text-[10px] sm:text-xs text-gray-600">Empacadores activos</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 col-span-2 lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-black">Tasa Defectos</CardTitle>
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="text-xl sm:text-2xl font-bold text-black">
                    {estadisticasTotales?.porcentajeDefectos || '0.0'}%
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-600">Frutas afectadas</p>
                </CardContent>
              </Card>
            </div>

            {/* New Metrics - Fruits Without Defects */}
            <div className="mb-6 sm:mb-8 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <Card className="bg-white border-green-200 border-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-black">Frutas sin Defectos</CardTitle>
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="text-2xl sm:text-3xl font-bold text-green-700">{estadisticasTotales?.frutasSinDefectos || 0}</div>
                  <p className="text-[10px] sm:text-xs text-gray-600 mt-1">
                    De {estadisticasTotales?.totalMuestras || 0} frutas totales
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-green-200 border-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-black">Porcentaje sin Defectos</CardTitle>
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="text-2xl sm:text-3xl font-bold text-green-700">{estadisticasTotales?.porcentajeSinDefectos || '0.0'}%</div>
                  <p className="text-[10px] sm:text-xs text-gray-600 mt-1">
                    Calidad de las frutas
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Weight Range Statistics */}
            <div className="mb-6 sm:mb-8 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              <Card className="bg-white border-blue-200 border-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-black">Dentro del Rango de Peso</CardTitle>
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-700">{estadisticasTotales?.dentroRangoPesoCount || 0}</div>
                  <p className="text-[10px] sm:text-xs text-gray-600 mt-1">
                    {estadisticasTotales?.porcentajeDentroRangoPeso || '0.0'}% del total
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-orange-200 border-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-black">Fuera del Rango de Peso</CardTitle>
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 flex-shrink-0" />
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="text-2xl sm:text-3xl font-bold text-orange-700">{estadisticasTotales?.fueraRangoPesoCount || 0}</div>
                  <p className="text-[10px] sm:text-xs text-gray-600 mt-1">
                    {estadisticasTotales?.porcentajeFueraRangoPeso || '0.0'}% del total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts - Based on filtered samples */}
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              {/* Bar Chart - Defects by Type */}
              <Card className="bg-white border-gray-200">
                <CardHeader className="px-3 sm:px-4 md:px-6 py-4 sm:py-5">
                  <CardTitle className="text-base sm:text-lg text-black">Defectos por Tipo</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600">
                    Cantidad de frutas afectadas por cada defecto {hasActiveFilters && '(filtrado)'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-4 md:px-6 pb-4 sm:pb-6">
                  {estadisticasTotales?.datosBarras && estadisticasTotales.datosBarras.length > 0 ? (
                    <>
                      <div className="w-full overflow-x-auto -mx-2 sm:mx-0">
                        <div className="min-w-[280px] px-2 sm:px-0">
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={estadisticasTotales.datosBarras} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis 
                                dataKey="defecto" 
                                tick={{ fontSize: 10, fill: '#000' }}
                                angle={-15}
                                textAnchor="end"
                                height={60}
                              />
                              <YAxis tick={{ fontSize: 10, fill: '#000' }} />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#fff',
                                  border: '1px solid #e5e5e5',
                                  borderRadius: '8px',
                                  color: '#000',
                                  fontSize: '12px',
                                }}
                              />
                              <Bar dataKey="cantidad" fill="oklch(var(--primary))" radius={[8, 8, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
                        {Object.entries(estadisticasTotales.defectosPorTipo || {})
                          .filter(([, count]) => count > 0)
                          .map(([defecto, count]) => (
                            <Badge key={defecto} variant="secondary" className="text-[10px] sm:text-xs">
                              {DEFECTO_LABELS[defecto as Defecto]}: {count}
                            </Badge>
                          ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                      <CheckCircle className="h-8 w-8 mb-2 text-green-600" />
                      <p className="text-sm">No hay defectos registrados</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {hasActiveFilters ? 'En los registros filtrados' : 'Todas las frutas están en perfecto estado'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Empacadores Distribution */}
              <Card className="bg-white border-gray-200">
                <CardHeader className="px-3 sm:px-4 md:px-6 py-4 sm:py-5">
                  <CardTitle className="text-base sm:text-lg text-black">Muestras por Empacador</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600">
                    Distribución de muestras analizadas {hasActiveFilters && '(filtrado)'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
                  {estadisticasTotales?.controlesPorEmpacador && Object.keys(estadisticasTotales.controlesPorEmpacador).length > 0 ? (
                    <div className="space-y-2 sm:space-y-3">
                      {Object.entries(estadisticasTotales.controlesPorEmpacador)
                        .sort(([, a], [, b]) => b - a)
                        .map(([identificador, count]) => {
                          // Find the empacador by identificador
                          const empacador = empacadores?.find(e => e.identificador === identificador);
                          const color = empacador?.color || '#6b7280';
                          
                          return (
                            <div key={identificador} className="flex items-center justify-between rounded-lg border border-gray-200 p-2 sm:p-3">
                              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                <div
                                  className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="font-medium text-xs sm:text-sm text-black truncate">{identificador}</span>
                              </div>
                              <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">{count} muestras</Badge>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                      <AlertCircle className="h-8 w-8 mb-2" />
                      <p className="text-sm">No hay datos de empacadores</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {hasActiveFilters ? 'En los registros filtrados' : ''}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Daily Breakdown for Range Mode */}
            {modoReporte === 'rango' && controlesPorFecha.length > 1 && (
              <Card className="mt-4 sm:mt-6 bg-white border-gray-200">
                <CardHeader className="px-3 sm:px-4 md:px-6 py-4 sm:py-5">
                  <CardTitle className="text-base sm:text-lg text-black">Desglose por Día (UTC-3)</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600">
                    Resumen de muestras para cada día del rango seleccionado {hasActiveFilters && '(filtrado)'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
                  <div className="space-y-3 sm:space-y-4">
                    {controlesPorFecha.map((grupo) => {
                      const controlesDia = grupo.controles.map(c => c.control);
                      if (controlesDia.length === 0) return null;
                      
                      const totalDefectos = controlesDia.reduce((sum, c) => 
                        sum + (c.defectos || []).reduce((s, d) => s + Number(d.cantidad || 0), 0), 0
                      );
                      const totalMuestras = controlesDia.reduce((sum, c) => sum + Number(c.cantidadMuestras || 0), 0);
                      const frutasSinDefectos = Math.max(0, totalMuestras - totalDefectos);
                      
                      return (
                        <div key={grupo.fecha.toString()} className="rounded-lg border border-gray-200 p-3 sm:p-4">
                          <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <h4 className="font-semibold text-sm sm:text-base text-primary break-words">
                              📅 {formatDateUTC3(grupo.fecha)}
                            </h4>
                            <Badge variant="outline" className="text-[10px] sm:text-xs self-start sm:self-auto">
                              🔢 {controlesDia.length} {controlesDia.length === 1 ? 'muestra' : 'muestras'}
                            </Badge>
                          </div>
                          <div className="grid gap-2 text-xs sm:text-sm grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <span className="text-gray-600">Frutas: </span>
                              <span className="font-medium text-black">{totalMuestras}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Con defectos: </span>
                              <span className="font-medium text-black">{totalDefectos}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Sin defectos: </span>
                              <span className="font-medium text-green-700">{frutasSinDefectos}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Tasa: </span>
                              <span className="font-medium text-black">
                                {totalMuestras > 0 ? ((totalDefectos / totalMuestras) * 100).toFixed(1) : '0.0'}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sample List with Filters Applied */}
            {controlesFiltrados.length > 0 && (
              <Card className="mt-4 sm:mt-6 bg-white border-gray-200">
                <CardHeader className="px-3 sm:px-4 md:px-6 py-4 sm:py-5">
                  <CardTitle className="text-base sm:text-lg text-black">Lista de Muestras</CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600">
                    {hasActiveFilters 
                      ? `Mostrando ${controlesFiltrados.length} de ${todosControles.length} muestras (filtros aplicados)`
                      : `Todas las ${todosControles.length} muestras del período seleccionado`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
                  <div className="space-y-2">
                    {controlesFiltrados.map((c) => {
                      const control = c.control;
                      const empacadorInfo = getEmpacadorInfo(control.empacadorId);
                      const totalDefectos = control.defectos.reduce((sum, d) => sum + Number(d.cantidad), 0);
                      const totalFrutas = Number(control.cantidadMuestras);
                      const frutasSinDefectos = Math.max(0, totalFrutas - totalDefectos);
                      const sampleTime = control.lote;
                      
                      return (
                        <div key={control.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-gray-200 p-2 sm:p-3">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                              <span className="font-bold text-sm sm:text-base text-black">{sampleTime}</span>
                            </div>
                            <div
                              className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: empacadorInfo.color }}
                              title={empacadorInfo.identificador}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs sm:text-sm text-black truncate">{empacadorInfo.identificador}</p>
                              <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-600">
                                <UserCheck className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{c.controlador.nombre}</span>
                              </div>
                              <p className="text-[10px] sm:text-xs text-gray-600">
                                {totalFrutas} frutas • {frutasSinDefectos} sin defectos • {control.dentroRangoPeso ? 'Peso: Sí' : 'Peso: No'}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {control.defectos.length > 0 ? (
                              control.defectos.slice(0, 2).map((d, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[9px] sm:text-[10px]">
                                  {DEFECTO_LABELS[d.defecto]}: {Number(d.cantidad)}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline" className="text-[9px] sm:text-[10px] bg-green-50 text-green-700 border-green-200">
                                ✅ Sin defectos
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
