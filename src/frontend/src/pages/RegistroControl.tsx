import { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Loader2, CheckCircle2, X, AlertTriangle, Info, Clock, RefreshCw, Scale, UserCheck } from 'lucide-react';
import { useRegistrarControl, useObtenerEmpacadoresActivos, useObtenerControladoresActivos, useObtenerProximoIdentificador } from '../hooks/useQueries';
import { Defecto } from '../backend';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { getCurrentDateDisplayUTC3, formatDateUTC3 } from '../lib/utc3';

export default function RegistroControl() {
  const [defectosCantidades, setDefectosCantidades] = useState<Record<Defecto, string>>({
    [Defecto.raset]: '0',
    [Defecto.cracking]: '0',
    [Defecto.golpeSol]: '0',
    [Defecto.podredumbre]: '0',
  });
  const [cantidadMuestras, setCantidadMuestras] = useState('');
  const [empacadorId, setEmpacadorId] = useState('');
  const [controladorId, setControladorId] = useState('');
  const [dentroRangoPeso, setDentroRangoPeso] = useState<string>('');
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploaded, setPhotoUploaded] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: empacadores, isLoading: isLoadingEmpacadores } = useObtenerEmpacadoresActivos();
  const { data: controladores, isLoading: isLoadingControladores } = useObtenerControladoresActivos();
  const { data: proximoIdentificador, isLoading: isLoadingIdentificador, refetch: refetchIdentificador } = useObtenerProximoIdentificador();
  const registrarMutation = useRegistrarControl();

  // Auto-refresh next identifier every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchIdentificador();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetchIdentificador]);

  const totalDefectos = useMemo(() => {
    return Object.values(defectosCantidades).reduce((sum, val) => sum + (parseInt(val) || 0), 0);
  }, [defectosCantidades]);

  const muestrasCount = parseInt(cantidadMuestras) || 0;
  const exceedsLimit = totalDefectos > muestrasCount;
  const progressPercentage = muestrasCount > 0 ? Math.min((totalDefectos / muestrasCount) * 100, 100) : 0;

  const handleDefectoCantidadChange = useCallback((defecto: Defecto, value: string) => {
    if (/^\d*$/.test(value)) {
      setDefectosCantidades((prev) => ({
        ...prev,
        [defecto]: value,
      }));
    }
  }, []);

  const handleDefectoFocus = useCallback((defecto: Defecto, value: string) => {
    if (value === '0') {
      setDefectosCantidades((prev) => ({
        ...prev,
        [defecto]: '',
      }));
    }
  }, []);

  const handleDefectoBlur = useCallback((defecto: Defecto, value: string) => {
    if (value === '') {
      setDefectosCantidades((prev) => ({
        ...prev,
        [defecto]: '0',
      }));
    }
  }, []);

  const handleOpenCamera = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor seleccione un archivo de imagen válido');
        return;
      }

      setCapturedPhoto(file);
      const preview = URL.createObjectURL(file);
      setPhotoPreview(preview);
      setPhotoUploaded(true);
      toast.success('Foto cargada correctamente');
    }
  }, []);

  const handleRemovePhoto = useCallback(() => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setCapturedPhoto(null);
    setPhotoPreview(null);
    setPhotoUploaded(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [photoPreview]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cantidadMuestras || muestrasCount <= 0) {
      toast.error('Por favor ingrese una cantidad de muestras válida');
      return;
    }

    if (!empacadorId) {
      toast.error('Por favor seleccione el empacador');
      return;
    }

    if (!controladorId) {
      toast.error('Por favor seleccione el controlador', {
        description: 'Este campo es obligatorio para registrar el control de calidad',
        duration: 5000,
      });
      return;
    }

    if (!dentroRangoPeso) {
      toast.error('Por favor seleccione si está dentro del rango de peso', {
        description: 'Este campo es obligatorio para registrar el control de calidad',
        duration: 5000,
      });
      return;
    }

    if (!capturedPhoto) {
      toast.error('Debes tomar una foto para continuar', {
        description: 'La foto es obligatoria para registrar el control de calidad',
        duration: 5000,
      });
      return;
    }

    if (exceedsLimit) {
      toast.error('La suma de defectos no puede exceder la cantidad de muestras');
      return;
    }

    const defectosArray = Object.entries(defectosCantidades)
      .filter(([, cantidad]) => parseInt(cantidad) > 0)
      .map(([defecto, cantidad]) => ({
        defecto: defecto as Defecto,
        cantidad: BigInt(parseInt(cantidad)),
      }));

    try {
      const result = await registrarMutation.mutateAsync({
        defectos: defectosArray,
        foto: capturedPhoto,
        cantidadMuestras: muestrasCount,
        empacadorId,
        controladorId,
        dentroRangoPeso: dentroRangoPeso === 'si',
      });

      const fechaRegistro = formatDateUTC3(result.fecha);
      
      const sampleTime = result.sampleTime;
      const frutasSinDefectos = muestrasCount - totalDefectos;
      const rangoPesoTexto = dentroRangoPeso === 'si' ? 'Sí' : 'No';
      
      toast.success('✅ Control registrado exitosamente', {
        description: `🕐 Identificador de muestra: ${sampleTime}\n📅 Fecha (UTC-3): ${fechaRegistro}\n🍎 Variedad: Wonderful\n⚖️ Dentro de rango de peso: ${rangoPesoTexto}\n✅ ${frutasSinDefectos} frutas sin defectos${totalDefectos > 0 ? `\n⚠️ ${totalDefectos} frutas con defectos` : ''}`,
        duration: 8000,
      });

      // Reset form
      setDefectosCantidades({
        [Defecto.raset]: '0',
        [Defecto.cracking]: '0',
        [Defecto.golpeSol]: '0',
        [Defecto.podredumbre]: '0',
      });
      setCantidadMuestras('');
      setEmpacadorId('');
      setControladorId('');
      setDentroRangoPeso('');
      setCapturedPhoto(null);
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
      setPhotoPreview(null);
      setPhotoUploaded(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Immediate refetch of next identifier
      await refetchIdentificador();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al registrar el control de calidad';
      toast.error(errorMessage);
      console.error(error);
    }
  }, [cantidadMuestras, empacadorId, controladorId, dentroRangoPeso, totalDefectos, exceedsLimit, defectosCantidades, capturedPhoto, muestrasCount, registrarMutation, photoPreview, refetchIdentificador]);

  const defectosOptions = useMemo(() => [
    { value: Defecto.raset, label: 'Raset' },
    { value: Defecto.cracking, label: 'Cracking' },
    { value: Defecto.golpeSol, label: 'Golpe de sol' },
    { value: Defecto.podredumbre, label: 'Podredumbre' },
  ], []);

  const isFormValid = !exceedsLimit && 
                      !!empacadores && 
                      empacadores.length > 0 &&
                      !!controladores &&
                      controladores.length > 0 &&
                      !!capturedPhoto &&
                      muestrasCount > 0 &&
                      !!empacadorId &&
                      !!controladorId &&
                      !!dentroRangoPeso;

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="w-full py-3 sm:py-4 md:py-6 lg:py-8 px-2 sm:px-3 md:px-4">
        <div className="mx-auto w-full max-w-2xl">
          <Card className="bg-white border-gray-200">
            <CardHeader className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg lg:text-xl text-black">
                <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span className="break-words">Nuevo Control de Calidad</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600 mt-1">
                Registre los defectos encontrados en la muestra (puede registrar sin defectos) • Zona horaria: UTC-3
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <AlertDescription className="text-xs sm:text-sm text-blue-800">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <strong>📅 Fecha (UTC-3):</strong> {getCurrentDateDisplayUTC3()}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs sm:text-sm text-black font-semibold">Nombre de muestra (UTC-3)</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => refetchIdentificador()}
                      className="h-7 px-2 text-xs"
                      disabled={isLoadingIdentificador}
                    >
                      <RefreshCw className={`h-3 w-3 ${isLoadingIdentificador ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border-2 border-primary bg-primary/5 px-3 py-3 sm:py-3.5">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                    <div className="flex-1">
                      {isLoadingIdentificador ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm text-gray-600">Cargando...</span>
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          <div className="text-lg sm:text-xl font-bold text-primary">
                            {proximoIdentificador || '00:00:00'}
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-600">
                            Identificador de tiempo UTC-3 que se asignará automáticamente
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-600 space-y-0.5 pl-1">
                    <div>• Identificador basado en hora UTC-3 de registro: <strong>HH:MM:SS</strong></div>
                    <div>• Único por día calendario UTC-3</div>
                    <div>• Se actualiza en tiempo real después de cada registro</div>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm text-black">Variedad de Granada</Label>
                  <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-black">
                    <span className="font-medium">🍎 Wonderful</span>
                    <span className="text-xs text-gray-600">(Variedad fija para todos los registros)</span>
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="cantidadMuestras" className="text-xs sm:text-sm text-black">Cantidad de frutas revisadas</Label>
                  <Input
                    id="cantidadMuestras"
                    type="number"
                    min="1"
                    value={cantidadMuestras}
                    onChange={(e) => setCantidadMuestras(e.target.value)}
                    placeholder="Ej: 10"
                    required
                    className="bg-white border-gray-300 text-black h-10 sm:h-11 text-sm"
                  />
                </div>

                <EmpacadorSelector
                  empacadorId={empacadorId}
                  setEmpacadorId={setEmpacadorId}
                  empacadores={empacadores}
                  isLoadingEmpacadores={isLoadingEmpacadores}
                />

                <ControladorSelector
                  controladorId={controladorId}
                  setControladorId={setControladorId}
                  controladores={controladores}
                  isLoadingControladores={isLoadingControladores}
                />

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="dentroRangoPeso" className="text-xs sm:text-sm text-black font-semibold">
                    Dentro de rango de peso <span className="text-destructive">*</span>
                  </Label>
                  <Select value={dentroRangoPeso} onValueChange={setDentroRangoPeso}>
                    <SelectTrigger id="dentroRangoPeso" className="bg-white border-gray-300 text-black h-10 sm:h-11 text-sm">
                      <SelectValue placeholder="Seleccione una opción" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-300">
                      <SelectItem value="si">
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4 text-green-600" />
                          <span>Sí</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="no">
                        <div className="flex items-center gap-2">
                          <Scale className="h-4 w-4 text-red-600" />
                          <span>No</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {dentroRangoPeso && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                      <Scale className={`h-4 w-4 ${dentroRangoPeso === 'si' ? 'text-green-600' : 'text-red-600'}`} />
                      <span>Seleccionado: {dentroRangoPeso === 'si' ? 'Sí' : 'No'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-xs sm:text-sm text-black">Defectos Detectados (Cantidad de frutas afectadas)</Label>
                  <div className="space-y-2 sm:space-y-3 rounded-lg border border-gray-200 p-2.5 sm:p-3 md:p-4 bg-white">
                    {defectosOptions.map((defecto) => (
                      <DefectoInput
                        key={defecto.value}
                        defecto={defecto}
                        value={defectosCantidades[defecto.value]}
                        onChange={handleDefectoCantidadChange}
                        onFocus={handleDefectoFocus}
                        onBlur={handleDefectoBlur}
                      />
                    ))}
                  </div>

                  {totalDefectos === 0 && muestrasCount > 0 && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <AlertDescription className="text-xs sm:text-sm text-green-800">
                        ✅ Se registrará un control sin defectos detectados. Esto indica que todas las {muestrasCount} frutas están en perfecto estado.
                      </AlertDescription>
                    </Alert>
                  )}

                  {muestrasCount > 0 && totalDefectos > 0 && (
                    <div className="space-y-2 rounded-lg border border-gray-200 p-2.5 sm:p-3 md:p-4 bg-white">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium text-black">Total de frutas con defectos:</span>
                        <span className={`font-bold ${exceedsLimit ? 'text-destructive' : 'text-black'}`}>
                          {totalDefectos} / {muestrasCount}
                        </span>
                      </div>
                      <Progress 
                        value={progressPercentage} 
                        className={exceedsLimit ? '[&>div]:bg-destructive' : ''}
                      />
                      {exceedsLimit && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                          <AlertDescription className="text-xs sm:text-sm">
                            La suma de defectos ({totalDefectos}) excede la cantidad de frutas ({muestrasCount})
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs sm:text-sm text-black font-semibold">
                      Foto de la Muestra <span className="text-destructive">*</span>
                    </Label>
                    <span className="text-[10px] sm:text-xs text-destructive font-medium">(Obligatorio)</span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {!capturedPhoto && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleOpenCamera}
                        className="w-full h-11 sm:h-10 text-sm border-primary hover:bg-primary/5"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Abrir Cámara
                      </Button>
                      <Alert className="border-amber-200 bg-amber-50">
                        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <AlertDescription className="text-xs sm:text-sm text-amber-800">
                          <strong>⚠️ Debes tomar una foto para continuar con el registro.</strong> La foto es obligatoria para documentar el control de calidad.
                        </AlertDescription>
                      </Alert>
                    </>
                  )}

                  {capturedPhoto && photoPreview && (
                    <div className="space-y-2 sm:space-y-3">
                      <div className="relative overflow-hidden rounded-lg border border-gray-300 bg-gray-50">
                        <img
                          src={photoPreview}
                          alt="Foto capturada"
                          className="w-full"
                          style={{ maxHeight: '400px', objectFit: 'contain' }}
                        />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 sm:p-2 text-white hover:bg-black/80 transition-colors"
                          aria-label="Eliminar foto"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {photoUploaded && (
                        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-2.5 sm:px-3 py-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-green-800 font-medium">
                            📸 Foto cargada correctamente
                          </span>
                        </div>
                      )}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleOpenCamera}
                        className="w-full h-11 sm:h-10 text-sm"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Cambiar Foto
                      </Button>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 sm:h-12 text-sm sm:text-base"
                  disabled={registrarMutation.isPending || !isFormValid}
                  size="lg"
                >
                  {registrarMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Registrar Control
                    </>
                  )}
                </Button>

                {!isFormValid && !registrarMutation.isPending && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <AlertDescription className="text-xs sm:text-sm text-amber-800">
                      <strong>Complete todos los campos requeridos:</strong>
                      <ul className="mt-1 ml-4 list-disc text-[10px] sm:text-xs">
                        {muestrasCount <= 0 && <li>Ingrese la cantidad de frutas</li>}
                        {!empacadorId && <li>Seleccione el empacador</li>}
                        {!controladorId && <li><strong>Seleccione el controlador (obligatorio)</strong></li>}
                        {!dentroRangoPeso && <li><strong>Seleccione si está dentro del rango de peso (obligatorio)</strong></li>}
                        {!capturedPhoto && <li><strong>Tome una foto (obligatorio)</strong></li>}
                        {exceedsLimit && <li>Corrija la cantidad de defectos</li>}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const DefectoInput = memo(function DefectoInput({ 
  defecto, 
  value, 
  onChange,
  onFocus,
  onBlur
}: { 
  defecto: { value: Defecto; label: string }; 
  value: string; 
  onChange: (defecto: Defecto, value: string) => void;
  onFocus: (defecto: Defecto, value: string) => void;
  onBlur: (defecto: Defecto, value: string) => void;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(defecto.value, e.target.value);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    onFocus(defecto.value, e.target.value);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onBlur(defecto.value, e.target.value);
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-3">
      <Label htmlFor={defecto.value} className="flex-1 font-normal text-xs sm:text-sm text-black break-words">
        {defecto.label}
      </Label>
      <Input
        id={defecto.value}
        type="number"
        min="0"
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-16 sm:w-20 bg-white border-gray-300 text-black h-9 sm:h-10 text-sm flex-shrink-0"
        placeholder="0"
      />
    </div>
  );
});

const EmpacadorSelector = memo(function EmpacadorSelector({
  empacadorId,
  setEmpacadorId,
  empacadores,
  isLoadingEmpacadores,
}: {
  empacadorId: string;
  setEmpacadorId: (id: string) => void;
  empacadores?: Array<{ id: string; identificador: string; color: string; activo: boolean }>;
  isLoadingEmpacadores: boolean;
}) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      <Label htmlFor="empacador" className="text-xs sm:text-sm text-black">Empacador</Label>
      {isLoadingEmpacadores ? (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando empacadores...
        </div>
      ) : !empacadores || empacadores.length === 0 ? (
        <Alert>
          <AlertDescription className="text-xs sm:text-sm">
            No hay empacadores configurados. Por favor, configure al menos un empacador en la sección de Configuración.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Select value={empacadorId} onValueChange={setEmpacadorId}>
            <SelectTrigger id="empacador" className="bg-white border-gray-300 text-black h-10 sm:h-11 text-sm">
              <SelectValue placeholder="Seleccione el empacador" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              {empacadores.map((empacador) => (
                <SelectItem key={empacador.id} value={empacador.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: empacador.color }}
                    />
                    <span className="truncate">{empacador.identificador}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {empacadorId && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <div
                className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border border-gray-300 flex-shrink-0"
                style={{
                  backgroundColor: empacadores.find((e) => e.id === empacadorId)?.color,
                }}
              />
              <span className="truncate">Seleccionado: {empacadores.find((e) => e.id === empacadorId)?.identificador}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
});

const ControladorSelector = memo(function ControladorSelector({
  controladorId,
  setControladorId,
  controladores,
  isLoadingControladores,
}: {
  controladorId: string;
  setControladorId: (id: string) => void;
  controladores?: Array<{ id: string; nombre: string; activo: boolean }>;
  isLoadingControladores: boolean;
}) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      <Label htmlFor="controlador" className="text-xs sm:text-sm text-black font-semibold">
        Controlador <span className="text-destructive">*</span>
      </Label>
      {isLoadingControladores ? (
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando controladores...
        </div>
      ) : !controladores || controladores.length === 0 ? (
        <Alert>
          <AlertDescription className="text-xs sm:text-sm">
            No hay controladores configurados. Por favor, configure al menos un controlador en la sección de Configuración.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Select value={controladorId} onValueChange={setControladorId}>
            <SelectTrigger id="controlador" className="bg-white border-gray-300 text-black h-10 sm:h-11 text-sm">
              <SelectValue placeholder="Seleccione el controlador" />
            </SelectTrigger>
            <SelectContent className="bg-white border-gray-300">
              {controladores.map((controlador) => (
                <SelectItem key={controlador.id} value={controlador.id}>
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-primary" />
                    <span className="truncate">{controlador.nombre}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {controladorId && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
              <UserCheck className="h-4 w-4 text-primary" />
              <span className="truncate">Seleccionado: {controladores.find((c) => c.id === controladorId)?.nombre}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
});
