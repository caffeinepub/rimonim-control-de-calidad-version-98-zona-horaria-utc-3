import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useObtenerHistorial, useObtenerEmpacadoresActivos, useObtenerControladoresActivos } from '../hooks/useQueries';
import { Defecto, ControlCalidadConControlador } from '../backend';
import { FileText, TrendingUp, AlertCircle, Package, Users, Calendar, CalendarRange, CheckCircle, Clock, Filter, FilterX, Download, UserCheck, Scale } from 'lucide-react';
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

  // Helper to get empacador info - memoized
  const getEmpacadorInfo = useMemo(() => {
    return (empacadorId: string) => {
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
  }, [empacadores]);

  // Helper to get controlador name - memoized
  const getControladorNombre = useMemo(() => {
    return (controladorId: string) => {
      const controlador = controladores?.find(c => c.id === controladorId);
      return controlador?.nombre || 'Desconocido';
    };
  }, [controladores]);

  // Check if any filter is active
  const hasActiveFilters = filtroDefecto !== 'todos' || filtroEmpacadorId !== 'todos' || filtroControladorId !== 'todos' || filtroRangoPeso !== 'todos';

  // Clear all filters
  const clearFilters = () => {
    setFiltroDefecto('todos');
    setFiltroEmpacadorId('todos');
    setFiltroControladorId('todos');
    setFiltroRangoPeso('todos');
  };

  // Apply filters to controls - memoized
  const aplicarFiltros = useMemo(() => {
    return (controles: ControlCalidadConControlador[]): ControlCalidadConControlador[] => {
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
  }, [filtroDefecto, filtroEmpacadorId, filtroControladorId, filtroRangoPeso, hasActiveFilters]);

  // Filter controls by date/range - memoized
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

  // Get filtered controls for display AND calculations - memoized
  const controlesFiltrados = useMemo(() => {
    return aplicarFiltros(todosControles);
  }, [todosControles, aplicarFiltros]);

  // Group controls by date for range mode - memoized
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

  // Calculate statistics from FILTERED controls - memoized
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
  }, [controlesFiltrados, modoReporte, controlesPorFecha, getEmpacadorInfo]);

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

              <TabsContent value="dia" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha" className="text-sm font-medium text-black">Fecha</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={fechaSeleccionada}
                    onChange={(e) => setFechaSeleccionada(e.target.value)}
                    className="bg-white border-gray-300 text-black"
                  />
                </div>
              </TabsContent>

              <TabsContent value="rango" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fechaInicio" className="text-sm font-medium text-black">Fecha Inicio</Label>
                    <Input
                      id="fechaInicio"
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="bg-white border-gray-300 text-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechaFin" className="text-sm font-medium text-black">Fecha Fin</Label>
                    <Input
                      id="fechaFin"
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="bg-white border-gray-300 text-black"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-4" />

            {/* Filters */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-black flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros Adicionales
                </Label>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    <FilterX className="h-3 w-3 mr-1" />
                    Limpiar filtros
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filtroDefecto" className="text-sm font-medium text-black">Tipo de Defecto</Label>
                  <Select value={filtroDefecto} onValueChange={(value) => setFiltroDefecto(value as Defecto | 'todos')}>
                    <SelectTrigger id="filtroDefecto" className="bg-white border-gray-300 text-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="todos">Todos los defectos</SelectItem>
                      {Object.entries(DEFECTO_LABELS).map(([defecto, label]) => (
                        <SelectItem key={defecto} value={defecto}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtroEmpacador" className="text-sm font-medium text-black">Empacador</Label>
                  <Select value={filtroEmpacadorId} onValueChange={setFiltroEmpacadorId}>
                    <SelectTrigger id="filtroEmpacador" className="bg-white border-gray-300 text-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="todos">Todos los empacadores</SelectItem>
                      {empacadoresUnicos.map((empacadorId) => {
                        const empacadorInfo = getEmpacadorInfo(empacadorId);
                        return (
                          <SelectItem key={empacadorId} value={empacadorId}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: empacadorInfo.color }}
                              />
                              {empacadorInfo.identificador}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtroControlador" className="text-sm font-medium text-black flex items-center gap-1">
                    <UserCheck className="h-4 w-4" />
                    Controlador
                  </Label>
                  <Select value={filtroControladorId} onValueChange={setFiltroControladorId}>
                    <SelectTrigger id="filtroControlador" className="bg-white border-gray-300 text-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="todos">Todos los controladores</SelectItem>
                      {controladoresUnicos.map((controladorId) => {
                        const controladorNombre = getControladorNombre(controladorId);
                        return (
                          <SelectItem key={controladorId} value={controladorId}>
                            {controladorNombre}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filtroRangoPeso" className="text-sm font-medium text-black">Rango de Peso</Label>
                  <Select value={filtroRangoPeso} onValueChange={(value) => setFiltroRangoPeso(value as 'todos' | 'si' | 'no')}>
                    <SelectTrigger id="filtroRangoPeso" className="bg-white border-gray-300 text-black">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="si">Dentro del rango</SelectItem>
                      <SelectItem value="no">Fuera del rango</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics and Charts */}
        {estadisticasTotales && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <Card className="bg-white border-gray-200">
                <CardHeader className="px-3 sm:px-4 py-3 sm:py-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1 sm:gap-2">
                    <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                    Controles
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-black">{estadisticasTotales.totalControles}</div>
                  <p className="text-xs text-gray-600 mt-1">registros</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="px-3 sm:px-4 py-3 sm:py-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1 sm:gap-2">
                    <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                    Muestras
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-black">{estadisticasTotales.totalMuestras}</div>
                  <p className="text-xs text-gray-600 mt-1">frutas</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="px-3 sm:px-4 py-3 sm:py-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1 sm:gap-2">
                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    Con Defectos
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600">{estadisticasTotales.porcentajeDefectos}%</div>
                  <p className="text-xs text-gray-600 mt-1">{estadisticasTotales.totalFrutasConDefectos} frutas</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200">
                <CardHeader className="px-3 sm:px-4 py-3 sm:py-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 flex items-center gap-1 sm:gap-2">
                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    Sin Defectos
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{estadisticasTotales.porcentajeSinDefectos}%</div>
                  <p className="text-xs text-gray-600 mt-1">{estadisticasTotales.frutasSinDefectos} frutas</p>
                </CardContent>
              </Card>
            </div>

            {/* Defects Chart */}
            {estadisticasTotales.datosBarras.length > 0 && (
              <Card className="mb-4 sm:mb-6 bg-white border-gray-200">
                <CardHeader className="px-3 sm:px-4 md:px-6 py-4 sm:py-5">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-black">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    Distribución de Defectos
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm text-gray-600">
                    Cantidad de frutas afectadas por cada tipo de defecto
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-4 md:px-6 pb-4 sm:pb-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={estadisticasTotales.datosBarras}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="defecto" tick={{ fill: '#000', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#000', fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          color: 'black',
                        }}
                      />
                      <Bar dataKey="cantidad" fill={CHART_COLORS[0]} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Weight Range Statistics */}
            <Card className="mb-4 sm:mb-6 bg-white border-gray-200">
              <CardHeader className="px-3 sm:px-4 md:px-6 py-4 sm:py-5">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-black">
                  <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
                  Estadísticas de Rango de Peso
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600">
                  Distribución de muestras dentro y fuera del rango de peso
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <p className="text-sm font-medium text-green-900">Dentro del Rango</p>
                      <p className="text-2xl font-bold text-green-700 mt-1">{estadisticasTotales.porcentajeDentroRangoPeso}%</p>
                      <p className="text-xs text-green-600 mt-1">{estadisticasTotales.dentroRangoPesoCount} muestras</p>
                    </div>
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div>
                      <p className="text-sm font-medium text-red-900">Fuera del Rango</p>
                      <p className="text-2xl font-bold text-red-700 mt-1">{estadisticasTotales.porcentajeFueraRangoPeso}%</p>
                      <p className="text-xs text-red-600 mt-1">{estadisticasTotales.fueraRangoPesoCount} muestras</p>
                    </div>
                    <AlertCircle className="h-12 w-12 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card className="bg-white border-gray-200">
              <CardHeader className="px-3 sm:px-4 md:px-6 py-4 sm:py-5">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-black">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  Información Adicional
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Package className="h-8 w-8 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600">Empacadores Únicos</p>
                      <p className="text-lg font-bold text-black">{estadisticasTotales.empacadoresUnicos}</p>
                    </div>
                  </div>

                  {modoReporte === 'rango' && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="h-8 w-8 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-600">Días con Registros</p>
                        <p className="text-lg font-bold text-black">{estadisticasTotales.diasUnicos}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* No Data Message */}
        {!estadisticasTotales && (
          <Card className="bg-white border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-12 px-4">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-center text-sm text-gray-600 font-medium">
                No hay datos para el período seleccionado
              </p>
              <p className="text-center text-xs text-gray-500 mt-2">
                Seleccione otra fecha o rango de fechas
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
