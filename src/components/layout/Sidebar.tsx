import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  UserCog, 
  LayoutDashboard, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  FileHeart,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.bmp';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Calendar, label: 'Agenda', path: '/agenda' },
  { icon: Users, label: 'Pacientes', path: '/pacientes' },
  { icon: UserCog, label: 'Profissionais', path: '/profissionais' },
  { icon: ClipboardList, label: 'Especialidades', path: '/especialidades' },
  { icon: FileHeart, label: 'Convênios', path: '/convenios' },
  { icon: MessageCircle, label: 'Mensagens', path: '/mensagens' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside 
      className={cn(
        "h-screen bg-white text-black flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="Painel Agenda"
            className={cn("object-contain flex-shrink-0", collapsed ? "w-10 h-10" : "h-10")}
          />
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-semibold text-lg text-foreground">Painel Agenda</h1>
              <p className="text-xs text-muted-foreground">Gestão de Clínicas</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "sidebar-item",
                isActive && "sidebar-item-active"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <span className="animate-fade-in">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-gray-200 hover:bg-primary/10 transition-colors flex items-center justify-center text-gray-700"
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>
    </aside>
  );
}
