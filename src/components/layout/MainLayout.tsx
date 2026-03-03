import { ReactNode, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLocation, useNavigate } from 'react-router-dom';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem('pa_token');

  useEffect(() => {
    if (!token) {
      navigate('/auth', { replace: true, state: { from: location.pathname } });
    }
  }, [token, navigate, location.pathname]);

  // não renderiza páginas (nem dispara fetch) se não tiver token
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Redirecionando para o login...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-auto p-6 bg-background">{children}</main>
      </div>
    </div>
  );
}
