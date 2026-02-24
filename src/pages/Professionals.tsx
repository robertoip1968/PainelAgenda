import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useProfessionals, useAppointments } from '@/hooks/useApiData';
import { AREA_LABELS } from '@/types';
import { Plus, Search, Edit, Calendar, Phone, Mail, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export function Professionals() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: professionals = [], isLoading, error } = useProfessionals();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: appointments = [] } = useAppointments({ date: today });

  const filteredProfessionals = professionals.filter((prof) =>
    prof.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (prof.specialtyName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProfessionalStats = (profId: number) => {
    const profAppointments = appointments.filter((a) => a.professional_id === profId);
    const completed = profAppointments.filter((a) => a.status === 'completed').length;
    return { total: profAppointments.length, completed };
  };

  if (isLoading) {
    return (
      <MainLayout title="Profissionais" subtitle="Carregando...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Profissionais" subtitle="Erro ao carregar">
        <div className="text-center py-12 text-destructive">
          <p>Erro ao carregar profissionais: {(error as Error).message}</p>
          <p className="text-sm text-muted-foreground mt-2">Verifique se a API backend está rodando.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Profissionais" subtitle={`${professionals.length} profissionais ativos`}>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou especialidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Link to="/profissionais/novo">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Profissional
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProfessionals.map((prof) => {
            const stats = getProfessionalStats(prof.id);
            return (
              <Card key={prof.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-lg">
                        {prof.full_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{prof.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{prof.specialtyName}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium text-primary">{prof.numero_conselho}</p>
                    <p className="text-xs text-muted-foreground">{AREA_LABELS[prof.area]}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {prof.phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-3 h-3" />
                      {prof.email}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>Hoje:</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{stats.total}</span>
                        <span className="text-muted-foreground"> agendamentos</span>
                      </div>
                    </div>
                    <div className="mt-2 w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-secondary rounded-full h-2 transition-all"
                        style={{ width: stats.total > 0 ? `${(stats.completed / stats.total) * 100}%` : '0%' }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats.completed} atendidos de {stats.total}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
