import { Camera, FileText, History, Settings, Users, Menu, LogOut, Shield, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useState, useCallback } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserRole } from '../backend';

type View = 'registro' | 'reportes' | 'historial' | 'configuracion' | 'usuarios' | 'roles';

interface HeaderProps {
  currentView: View;
  onViewChange: (view: View) => void;
  userRole?: UserRole;
}

const roleLabels: Record<UserRole, string> = {
  [UserRole.admin]: 'Administrador',
  [UserRole.user]: 'Carga',
  [UserRole.guest]: 'Lectura',
};

const roleColors: Record<UserRole, 'default' | 'secondary' | 'destructive'> = {
  [UserRole.admin]: 'destructive',
  [UserRole.user]: 'default',
  [UserRole.guest]: 'secondary',
};

export default function Header({ currentView, onViewChange, userRole }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  // Define navigation items with role-based access
  const getNavigationItems = () => {
    const items = [
      { view: 'reportes' as View, icon: FileText, label: 'Reportes', roles: [UserRole.admin, UserRole.user, UserRole.guest] },
      { view: 'historial' as View, icon: History, label: 'Historial', roles: [UserRole.admin, UserRole.user, UserRole.guest] },
      { view: 'registro' as View, icon: Camera, label: 'Registro', roles: [UserRole.admin, UserRole.user] },
      { view: 'configuracion' as View, icon: Settings, label: 'Config', roles: [UserRole.admin] },
      { view: 'usuarios' as View, icon: Users, label: 'Usuarios', roles: [UserRole.admin] },
      { view: 'roles' as View, icon: UserCog, label: 'Roles', roles: [UserRole.admin] },
    ];

    // Filter items based on user role
    if (!userRole) return [];
    return items.filter(item => item.roles.includes(userRole));
  };

  const navigationItems = getNavigationItems();

  const handleNavigation = useCallback((view: View) => {
    onViewChange(view);
    setMobileMenuOpen(false);
  }, [onViewChange]);

  const handleLogout = useCallback(async () => {
    try {
      await clear();
      queryClient.clear();
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error al cerrar sesión');
    }
  }, [clear, queryClient]);

  const principalId = identity?.getPrincipal().toString();
  const shortPrincipal = principalId && !identity?.getPrincipal().isAnonymous() 
    ? `${principalId.slice(0, 5)}...${principalId.slice(-3)}` 
    : '';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4 md:px-6 max-w-[100vw]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <img 
            src="/assets/generated/granada-icon-transparent.dim_64x64.png" 
            alt="Granada" 
            className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 flex-shrink-0" 
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xs sm:text-sm md:text-base lg:text-xl font-bold text-primary leading-tight truncate">
              Rimonim Control de Calidad
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-600 hidden sm:block truncate">
              Granadas Wonderful y Acco
            </p>
          </div>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 flex-shrink-0">
          {navigationItems.map(({ view, icon: Icon, label }) => (
            <Button
              key={view}
              variant={currentView === view ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange(view)}
              className="gap-1.5 xl:gap-2 text-xs xl:text-sm h-8 xl:h-9 px-2 xl:px-3"
            >
              <Icon className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
              <span className="hidden xl:inline">{label}</span>
              <span className="xl:hidden">{label === 'Configuracion' ? 'Config' : label}</span>
            </Button>
          ))}
          {isAuthenticated && userRole && (
            <>
              <Badge variant={roleColors[userRole]} className="text-[10px] ml-2">
                <Shield className="h-3 w-3 mr-1" />
                {roleLabels[userRole]}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5 text-xs h-8 px-2 text-gray-600 hover:text-destructive"
                title={principalId}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">{shortPrincipal}</span>
              </Button>
            </>
          )}
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[320px] bg-white">
            <SheetHeader>
              <SheetTitle className="text-black text-base sm:text-lg">Menú de Navegación</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-2">
              {navigationItems.map(({ view, icon: Icon, label }) => (
                <Button
                  key={view}
                  variant={currentView === view ? 'default' : 'ghost'}
                  onClick={() => handleNavigation(view)}
                  className="w-full justify-start gap-3 h-11 sm:h-12 text-sm sm:text-base"
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>{label}</span>
                </Button>
              ))}
              <div className="my-2 border-t border-gray-200" />
              {isAuthenticated && userRole && (
                <>
                  <div className="px-3 py-2 text-xs text-gray-600">
                    <p className="font-medium mb-1">Rol:</p>
                    <Badge variant={roleColors[userRole]} className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      {roleLabels[userRole]}
                    </Badge>
                    <p className="font-medium mb-1 mt-3">Usuario:</p>
                    <p className="break-all">{shortPrincipal}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full justify-start gap-3 h-11 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </Button>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
