import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { appointments, professionals, patients } from '@/data/mockData';
import { Calendar, Users, UserCog, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { StatusBadge } from '@/components/schedule/StatusBadge';
import { ChartDetailTable } from '@/components/dashboard/ChartDetailTable';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { AppointmentStatus } from '@/types';
import dashboardBanner from '@/assets/dashboard-banner.png';

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

const chartData = [
  { name: 'Contatos', value: 45, color: '#3B82F6' },
  { name: 'Agendamentos', value: 30, color: '#F472B6' },
  { name: 'Confirmações', value: 25, color: '#F59E0B' },
  { name: 'Cancelamentos', value: 15, color: '#10B981' },
  { name: 'Reagendamento', value: 10, color: '#6EE7B7' },
  { name: 'No-show', value: 8, color: '#EF4444' },
];

// Mock data for the detail table based on category
const getMockDataForCategory = (category: string) => {
  const baseData = [
    {
      id: '1',
      patientName: 'João Pedro Almeida',
      professionalName: 'Dr. Carlos Silva',
      date: format(new Date(), 'dd/MM/yyyy'),
      time: '08:00',
      status: 'confirmed' as AppointmentStatus,
      type: 'Consulta',
    },
    {
      id: '2',
      patientName: 'Maria Fernanda Lima',
      professionalName: 'Dra. Maria Santos',
      date: format(new Date(), 'dd/MM/yyyy'),
      time: '09:30',
      status: 'waiting' as AppointmentStatus,
      type: 'Retorno',
    },
    {
      id: '3',
      patientName: 'Pedro Henrique Santos',
      professionalName: 'Dr. Roberto Oliveira',
      date: format(new Date(), 'dd/MM/yyyy'),
      time: '10:00',
      status: 'completed' as AppointmentStatus,
      type: 'Exame',
    },
    {
      id: '4',
      patientName: 'Ana Carolina Souza',
      professionalName: 'Dra. Ana Costa',
      date: format(new Date(), 'dd/MM/yyyy'),
      time: '11:00',
      status: 'in-progress' as AppointmentStatus,
      type: 'Procedimento',
    },
    {
      id: '5',
      patientName: 'Lucas Martins',
      professionalName: 'Dr. Carlos Silva',
      date: format(new Date(), 'dd/MM/yyyy'),
      time: '14:00',
      status: 'queue' as AppointmentStatus,
      type: 'Consulta',
    },
  ];

  const statusMap: Record<string, AppointmentStatus> = {
    'Contatos': 'waiting',
    'Agendamentos': 'confirmed',
    'Confirmações': 'confirmed',
    'Cancelamentos': 'absent',
    'Reagendamento': 'waiting',
    'No-show': 'absent',
  };

  return baseData.map((item, index) => ({
    ...item,
    id: `${category}-${index}`,
    status: statusMap[category] || item.status,
  })).slice(0, chartData.find(c => c.name === category)?.value ? Math.min(5, chartData.find(c => c.name === category)!.value) : 0);
};

export function Dashboard() {
  const [weekFilter, setWeekFilter] = useState('current');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const todayAppointments = appointments.slice(0, 5);
  const pendingConfirmations = appointments.filter((a) => a.status === 'waiting');

  const getWeekLabel = () => {
    const now = new Date();
    if (weekFilter === 'current') {
      return `${format(startOfWeek(now, { weekStartsOn: 1 }), 'dd/MM')} - ${format(endOfWeek(now, { weekStartsOn: 1 }), 'dd/MM')}`;
    } else if (weekFilter === 'last') {
      const lastWeek = subWeeks(now, 1);
      return `${format(startOfWeek(lastWeek, { weekStartsOn: 1 }), 'dd/MM')} - ${format(endOfWeek(lastWeek, { weekStartsOn: 1 }), 'dd/MM')}`;
    }
    return '';
  };

  const handlePieClick = (data: { name: string }) => {
    setSelectedCategory(data.name);
  };

  const tableData = selectedCategory ? getMockDataForCategory(selectedCategory) : [];

  return (
    <MainLayout 
      title="Dashboard" 
      subtitle={format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Banner */}
        <div className="w-full h-48 rounded-xl overflow-hidden">
          <img 
            src={dashboardBanner} 
            alt="Recepção da clínica" 
            className="w-full h-full object-cover"
          />
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
                <Select value={weekFilter} onValueChange={setWeekFilter}>
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
                            stroke={selectedCategory === entry.name ? 'hsl(var(--foreground))' : 'none'}
                            strokeWidth={selectedCategory === entry.name ? 3 : 0}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${value}`, '']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
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

        {/* Chart Detail Table */}
        <ChartDetailTable 
          selectedCategory={selectedCategory} 
          data={tableData} 
        />

        {/* Today's Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Próximos Atendimentos</CardTitle>
            <a href="/agenda" className="text-sm text-primary hover:underline">
              Ver agenda completa
            </a>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
      </div>
    </MainLayout>
  );
}
