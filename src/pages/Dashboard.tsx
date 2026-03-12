import { useEffect, useMemo, useState } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Calendar, Users, UserCog, Clock, TrendingUp, AlertCircle } from 'lucide-react';

import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

import { StatusBadge } from '@/components/schedule/StatusBadge';
import { ChartDetailTable } from '@/components/dashboard/ChartDetailTable';
import dashboardBanner from '@/assets/dashboard-banner.png';

import { useDashboardDetails, useDashboardOverview, useDashboardStats, useAppointments } from '@/hooks/useApiData';
import { APPOINTMENT_TYPE_LABELS, DashboardCategory } from '@/types';

export function Dashboard() {
  const [weekFilter, setWeekFilter] = useState<'current' | 'last'>('current');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DashboardCategory | null>(null);

  // Quando muda filtro, limpa seleção (evita tabela “travada” em categoria antiga)
  useEffect(() => {
    setSelectedCategory(null);
  }, [weekFilter, dateFilter]);

  const dashboardFilters = useMemo(
    () => ({
      period: weekFilter,
      date: dateFilter || undefined,
    }),
    [weekFilter, dateFilter]
  );

  const { data: dashStats, isLoading: statsLoading } = useDashboardStats();
  const { data: overview, isLoading: overviewLoading } = useDashboardOverview(dashboardFilters);
  const { data: tableData = [], isLoading: detailsLoading } = useDashboardDetails(selectedCategory, dashboardFilters);

  // Próximos atendimentos (hoje) — reaproveita endpoint já existente
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: todayAppointmentsRaw = [] } = useAppointments({ date: todayStr });

  const todayAppointments = useMemo(() => {
    return (todayAppointmentsRaw || []).slice(0, 6).map((a: any) => {
      const inicio = a.inicio ? new Date(a.inicio) : null;
      const time = (a as any).time || (inicio ? format(inicio, 'HH:mm') : '');
      const typeLabel = APPOINTMENT_TYPE_LABELS[a.tipo] || a.tipo || '—';
      return {
        ...a,
        time,
        typeLabel,
      };
    });
  }, [todayAppointmentsRaw]);

  const chartData = overview?.chart ?? [];
  const pendingConfirmations = overview?.pendingConfirmations ?? [];

  const getWeekLabel = () => {
    if (dateFilter) {
      const d = new Date(`${dateFilter}T00:00:00`);
      return format(d, 'dd/MM/yyyy');
    }

    const now = new Date();
    if (weekFilter === 'current') {
      return `${format(startOfWeek(now, { weekStartsOn: 1 }), 'dd/MM')} - ${format(
        endOfWeek(now, { weekStartsOn: 1 }),
        'dd/MM'
      )}`;
    }

    const lastWeek = subWeeks(now, 1);
    return `${format(startOfWeek(lastWeek, { weekStartsOn: 1 }), 'dd/MM')} - ${format(
      endOfWeek(lastWeek, { weekStartsOn: 1 }),
      'dd/MM'
    )}`;
  };

  const handlePieClick = (entry: any) => {
    const key = entry?.payload?.key ?? entry?.key;
    if (key) setSelectedCategory(key as DashboardCategory);
  };

  const stats = [
    {
      title: 'Agendamentos Hoje',
      value: statsLoading ? <Skeleton className="h-9 w-16 mt-2" /> : dashStats?.appointments_today ?? 0,
      icon: Calendar,
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'Pacientes Cadastrados',
      value: statsLoading ? <Skeleton className="h-9 w-16 mt-2" /> : dashStats?.patients_total ?? 0,
      icon: Users,
      trend: '+5%',
      trendUp: true,
    },
    {
      title: 'Profissionais Ativos',
      value: statsLoading ? <Skeleton className="h-9 w-16 mt-2" /> : dashStats?.professionals_active ?? 0,
      icon: UserCog,
      trend: '0%',
      trendUp: true,
    },
    {
      title: 'Tempo Médio de Espera',
      value: statsLoading ? <Skeleton className="h-9 w-20 mt-2" /> : dashStats?.avg_wait_time ?? '—',
      icon: Clock,
      trend: '-8%',
      trendUp: true,
    },
  ];

  return (
    <MainLayout title="Dashboard" subtitle={format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}>
      <div className="space-y-6 animate-fade-in">
        {/* Banner */}
        <div className="w-full h-48 rounded-xl overflow-hidden">
          <img src={dashboardBanner} alt="Recepção da clínica" className="w-full h-full object-cover" />
        </div>

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
                      <span className={`text-sm ${stat.trendUp ? 'text-secondary' : 'text-destructive'}`}>{stat.trend}</span>
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
          {/* Donut Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Resumo de Atendimentos</CardTitle>
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-40 h-9"
                />
                <Select value={weekFilter} onValueChange={(v) => setWeekFilter(v as 'current' | 'last')}>
                  <SelectTrigger className="w-40 h-9">
                    <SelectValue placeholder="Semana" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Semana Atual</SelectItem>
                    <SelectItem value="last">Semana Passada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <Skeleton className="h-[320px] w-full" />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="value"
                          onClick={handlePieClick}
                          cursor="pointer"
                        >
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke={selectedCategory === entry.key ? 'hsl(var(--foreground))' : 'none'}
                              strokeWidth={selectedCategory === entry.key ? 3 : 0}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [`${value}`, '']}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend
                          layout="vertical"
                          align="right"
                          verticalAlign="middle"
                          formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground text-center mt-2">
                Período: {getWeekLabel()} • Clique em uma fatia para ver detalhes
              </p>
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
                {overviewLoading ? (
                  Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-16 w-full" />)
                ) : pendingConfirmations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Nenhum agendamento pendente</p>
                ) : (
                  pendingConfirmations.map((apt) => (
                    <div key={apt.id} className="p-3 rounded-lg border border-status-waiting/30 bg-status-waiting/5">
                      <p className="font-medium text-sm">{apt.cliente_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(apt.inicio), 'dd/MM HH:mm')} • {apt.professional_name}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <ChartDetailTable selectedCategory={selectedCategory} data={tableData} isLoading={detailsLoading} />

        {/* Próximos atendimentos (hoje) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Próximos Atendimentos</CardTitle>
            <a href="/agenda" className="text-sm text-primary hover:underline">
              Ver agenda completa
            </a>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {todayAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum agendamento para hoje.</p>
              ) : (
                todayAppointments.map((apt: any) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-primary">{apt.time}</p>
                      </div>
                      <div>
                        <p className="font-medium">{apt.cliente_nome}</p>
                        <p className="text-sm text-muted-foreground">{apt.typeLabel}</p>
                      </div>
                    </div>
                    <StatusBadge status={apt.status} />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
