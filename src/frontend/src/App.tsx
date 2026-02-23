import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { InternetIdentityProvider } from './hooks/useInternetIdentity';
import { useActor } from './hooks/useActor';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserRole } from './hooks/useQueries';
import Header from './components/Header';
import Footer from './components/Footer';
import RegistroControl from './pages/RegistroControl';
import Reportes from './pages/Reportes';
import Historial from './pages/Historial';
import ConfiguracionEmpacadores from './pages/ConfiguracionEmpacadores';
import ConfiguracionControladores from './pages/ConfiguracionControladores';
import GestionUsuarios from './pages/GestionUsuarios';
import RolesUsuarios from './pages/RolesUsuarios';
import Login from './pages/Login';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserRole } from './backend';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

type View = 'registro' | 'reportes' | 'historial' | 'configuracion' | 'usuarios' | 'roles';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
      gcTime: 300000,
    },
    mutations: {
      retry: 0,
    },
  },
});

function AppContent() {
  const [currentView, setCurrentView] = useState<View>('reportes');
  const [configTab, setConfigTab] = useState<'empacadores' | 'controladores'>('empacadores');
  const { actor, isFetching: isActorLoading } = useActor();
  const { identity } = useInternetIdentity();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  // Get user role
  const { data: userRole, isLoading: isLoadingRole } = useGetCallerUserRole();

  useEffect(() => {
    if (actor) {
      setIsInitialLoad(false);
    }
  }, [actor]);

  // Check if user has access to current view
  const hasAccessToView = (view: View): boolean => {
    if (!isAuthenticated || !userRole) return false;

    switch (view) {
      case 'registro':
        // Only user and admin can register
        return userRole === UserRole.user || userRole === UserRole.admin;
      case 'reportes':
      case 'historial':
        // All authenticated users can view
        return true;
      case 'configuracion':
      case 'usuarios':
      case 'roles':
        // Only admin can access
        return userRole === UserRole.admin;
      default:
        return false;
    }
  };

  // Redirect to appropriate view if user doesn't have access
  useEffect(() => {
    if (isAuthenticated && userRole && !hasAccessToView(currentView)) {
      // Redirect to first available view
      if (userRole === UserRole.admin) {
        setCurrentView('registro');
      } else if (userRole === UserRole.user) {
        setCurrentView('registro');
      } else {
        setCurrentView('reportes');
      }
    }
  }, [isAuthenticated, userRole, currentView]);

  // Show loading screen during initial actor initialization
  if (isInitialLoad && isActorLoading && !actor) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-4">
            <div className="text-center mb-6">
              <img 
                src="/assets/generated/granada-icon-transparent.dim_64x64.png" 
                alt="Granada" 
                className="h-16 w-16 mx-auto mb-4" 
              />
              <h2 className="text-xl font-bold text-black">Cargando aplicación...</h2>
              <p className="text-sm text-gray-600 mt-2">Por favor espere</p>
            </div>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header 
          currentView={currentView} 
          onViewChange={setCurrentView}
          userRole={undefined}
        />
        <main className="flex-1 bg-white">
          <Login />
        </main>
        <Footer />
      </div>
    );
  }

  // Show loading while fetching role
  if (isLoadingRole) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header 
          currentView={currentView} 
          onViewChange={setCurrentView}
          userRole={undefined}
        />
        <main className="flex-1 bg-white flex items-center justify-center">
          <div className="text-center">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <p className="text-sm text-gray-600">Verificando permisos...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Check access to current view
  const hasAccess = hasAccessToView(currentView);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView}
        userRole={userRole}
      />
      <main className="flex-1 bg-white">
        {!hasAccess ? (
          <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="max-w-md w-full">
              <Alert className="border-red-200 bg-red-50">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-sm text-red-800 ml-2">
                  <strong>Acceso Denegado</strong>
                  <p className="mt-2">No tiene permisos para acceder a esta sección.</p>
                  <p className="mt-1 text-xs">
                    {userRole === UserRole.guest && 'Su rol de "Lectura" solo permite ver Reportes e Historial.'}
                    {userRole === UserRole.user && 'Su rol de "Carga" permite registrar controles y ver reportes.'}
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        ) : (
          <>
            {currentView === 'registro' && <RegistroControl />}
            {currentView === 'reportes' && <Reportes />}
            {currentView === 'historial' && <Historial userRole={userRole} />}
            {currentView === 'configuracion' && (
              <div className="min-h-screen bg-white text-black">
                <div className="w-full py-3 sm:py-4 md:py-6 lg:py-8 px-2 sm:px-3 md:px-4">
                  <Tabs value={configTab} onValueChange={(value) => setConfigTab(value as 'empacadores' | 'controladores')}>
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="empacadores">Empacadores</TabsTrigger>
                      <TabsTrigger value="controladores">Controladores</TabsTrigger>
                    </TabsList>
                    <TabsContent value="empacadores">
                      <ConfiguracionEmpacadores />
                    </TabsContent>
                    <TabsContent value="controladores">
                      <ConfiguracionControladores />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
            {currentView === 'usuarios' && <GestionUsuarios />}
            {currentView === 'roles' && <RolesUsuarios />}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InternetIdentityProvider>
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
          <AppContent />
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'white',
                color: 'black',
                border: '1px solid #e5e5e5',
              },
            }}
          />
        </ThemeProvider>
      </InternetIdentityProvider>
    </QueryClientProvider>
  );
}

export default App;
