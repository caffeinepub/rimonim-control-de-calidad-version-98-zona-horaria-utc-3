import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { UserRole } from '../backend';
import { LogOut, LogIn, FileText, BarChart3, History, Settings, Users, ShieldCheck } from 'lucide-react';

type View = 'registro' | 'reportes' | 'historial' | 'configuracion' | 'usuarios' | 'roles';

interface HeaderProps {
  currentView: View;
  onViewChange: (view: View) => void;
  userRole?: UserRole;
}

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.admin]: 'Administrador',
  [UserRole.user]: 'Carga',
  [UserRole.guest]: 'Lectura',
};

const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.admin]: 'bg-primary text-white',
  [UserRole.user]: 'bg-blue-600 text-white',
  [UserRole.guest]: 'bg-gray-600 text-white',
};

export default function Header({ currentView, onViewChange, userRole }: HeaderProps) {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const disabled = loginStatus === 'logging-in';
  const text = loginStatus === 'logging-in' ? 'Iniciando...' : isAuthenticated ? 'Cerrar Sesión' : 'Iniciar Sesión';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  // Memoize menu items based on role
  const menuItems = useMemo(() => {
    if (!isAuthenticated || !userRole) return [];

    const items: Array<{ view: View; label: string; icon: React.ReactNode }> = [];

    // Registro - Only for user and admin
    if (userRole === UserRole.user || userRole === UserRole.admin) {
      items.push({
        view: 'registro',
        label: 'Registro',
        icon: <FileText className="h-4 w-4" />,
      });
    }

    // Reportes - All authenticated users
    items.push({
      view: 'reportes',
      label: 'Reportes',
      icon: <BarChart3 className="h-4 w-4" />,
    });

    // Historial - All authenticated users
    items.push({
      view: 'historial',
      label: 'Historial',
      icon: <History className="h-4 w-4" />,
    });

    // Configuración - Only admin
    if (userRole === UserRole.admin) {
      items.push({
        view: 'configuracion',
        label: 'Configuración',
        icon: <Settings className="h-4 w-4" />,
      });
    }

    // Usuarios - Only admin
    if (userRole === UserRole.admin) {
      items.push({
        view: 'usuarios',
        label: 'Usuarios',
        icon: <Users className="h-4 w-4" />,
      });
    }

    // Roles - Only admin
    if (userRole === UserRole.admin) {
      items.push({
        view: 'roles',
        label: 'Roles',
        icon: <ShieldCheck className="h-4 w-4" />,
      });
    }

    return items;
  }, [isAuthenticated, userRole]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <img 
              src="/assets/generated/granada-icon-transparent.dim_64x64.png" 
              alt="Granada" 
              className="h-8 w-8 sm:h-10 sm:w-10" 
            />
            <div className="flex flex-col">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-black leading-tight">
                Control de Calidad
              </h1>
              <p className="text-xs text-gray-600 hidden sm:block">Rimonim</p>
            </div>
          </div>

          {/* Navigation and Auth */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {/* Navigation Menu */}
            {isAuthenticated && menuItems.length > 0 && (
              <nav className="hidden md:flex items-center gap-1">
                {menuItems.map((item) => (
                  <Button
                    key={item.view}
                    variant={currentView === item.view ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onViewChange(item.view)}
                    className={`flex items-center gap-2 ${
                      currentView === item.view
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'text-black hover:bg-gray-100'
                    }`}
                  >
                    {item.icon}
                    <span className="hidden lg:inline">{item.label}</span>
                  </Button>
                ))}
              </nav>
            )}

            {/* Mobile Navigation Dropdown */}
            {isAuthenticated && menuItems.length > 0 && (
              <div className="md:hidden">
                <select
                  value={currentView}
                  onChange={(e) => onViewChange(e.target.value as View)}
                  className="text-xs sm:text-sm px-2 py-1 border border-gray-300 rounded-md bg-white text-black"
                >
                  {menuItems.map((item) => (
                    <option key={item.view} value={item.view}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Role Badge */}
            {isAuthenticated && userRole && (
              <Badge className={`${ROLE_COLORS[userRole]} text-xs hidden sm:inline-flex`}>
                {ROLE_LABELS[userRole]}
              </Badge>
            )}

            {/* Auth Button */}
            <Button
              onClick={handleAuth}
              disabled={disabled}
              size="sm"
              variant={isAuthenticated ? 'outline' : 'default'}
              className={`flex items-center gap-2 text-xs sm:text-sm ${
                isAuthenticated
                  ? 'bg-white text-black border-gray-300 hover:bg-gray-100'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {isAuthenticated ? (
                <>
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{text}</span>
                </>
              ) : (
                <>
                  <LogIn className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">{text}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
