import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { login, loginStatus, isLoginError, loginError } = useInternetIdentity();
  const [error, setError] = useState<string | null>(null);

  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    setError(null);
    try {
      await login();
      toast.success('Sesión iniciada correctamente');
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Error al iniciar sesión';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const displayError = error || (isLoginError && loginError?.message);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src="/assets/generated/granada-icon-transparent.dim_64x64.png" 
            alt="Granada" 
            className="h-20 w-20 mx-auto mb-4" 
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
            Rimonim Control de Calidad
          </h1>
          <p className="text-sm text-gray-600">
            Sistema de control de calidad para granadas Wonderful
          </p>
        </div>

        <Card className="bg-white border-gray-200 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-black">Iniciar Sesión</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              Autentíquese con Internet Identity para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {displayError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-sm text-red-800 ml-2">
                  {displayError}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full h-12 text-base gap-2"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Conectando...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Iniciar Sesión con Internet Identity
                </>
              )}
            </Button>

            <div className="text-center text-xs text-gray-600 space-y-2 pt-4 border-t border-gray-200">
              <p>
                <strong>Roles del sistema:</strong>
              </p>
              <ul className="text-left space-y-1 max-w-xs mx-auto">
                <li>• <strong>Lectura:</strong> Ver reportes e historial</li>
                <li>• <strong>Carga:</strong> Registrar controles de calidad</li>
                <li>• <strong>Administrador:</strong> Acceso completo</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-gray-600">
          <p>Zona horaria: UTC-3</p>
          <p className="mt-2">
            ¿Primera vez? El sistema le asignará un rol después del primer inicio de sesión.
          </p>
        </div>
      </div>
    </div>
  );
}
