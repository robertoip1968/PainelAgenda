import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { appointments, professionals, patients } from '@/data/mockData';
import { Calendar, Users, UserCog, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { StatusBadge } from '@/components/schedule/StatusBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const stats = [
  {
    title: 'Agendamentos Hoje',
    value: appointments.length,
    icon: Calendar,
    trend: '+12%',
    trendUp: true,
  },
  {
    title: 'Pacientes Cadastrados',
    value: patients.length,
    icon: Users,
    trend: '+5%',
    trendUp: true,
  },
  {
    title: 'Profissionais Ativos',
    value: professionals.length,
    icon: UserCog,
    trend: '0%',
    trendUp: true,
  },
  {
    title: 'Tempo Médio de Espera',
    value: '15min',
    icon: Clock,
    trend: '-8%',
    trendUp: true,
  },
];

export function Dashboard() {
  const todayAppointments = appointments.slice(0, 5);
  const pendingConfirmations = appointments.filter((a) => a.status === 'waiting');

  return (
    <MainLayout 
      title="Dashboard" 
      subtitle={format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className={`w-4 h-4 ${stat.trendUp ? 'text-secondary' : 'text-destructive'}`} />
                      <span className={`text-sm ${stat.trendUp ? 'text-secondary' : 'text-destructive'}`}>
                        {stat.trend}
                      </span>
                      <span className="text-xs text-muted-foreground">vs mês anterior</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Appointments */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Próximos Atendimentos</CardTitle>
              <a href="/agenda" className="text-sm text-primary hover:underline">
                Ver agenda completa
              </a>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-primary">{apt.time}</p>
                      </div>
                      <div>
                        <p className="font-medium">{apt.patientName}</p>
                        <p className="text-sm text-muted-foreground">{apt.professionalName}</p>
                      </div>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Confirmations */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-status-waiting" />
                Aguardando Confirmação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingConfirmations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum agendamento pendente
                  </p>
                ) : (
                  pendingConfirmations.map((apt) => (
                    <div
                      key={apt.id}
                      className="p-3 rounded-lg border border-status-waiting/30 bg-status-waiting/5"
                    >
                      <p className="font-medium text-sm">{apt.patientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {apt.time} • {apt.professionalName}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Professionals Overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Profissionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {professionals.map((prof) => {
                const profAppointments = appointments.filter((a) => a.professionalId === prof.id);
                return (
                  <div
                    key={prof.id}
                    className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-semibold">
                        {prof.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{prof.name}</p>
                        <p className="text-xs text-muted-foreground">{prof.specialty}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Hoje:</span>
                      <span className="font-medium">{profAppointments.length} agendamentos</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
