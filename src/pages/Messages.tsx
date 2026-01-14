import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, Filter, ArrowUpRight, ArrowDownLeft, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { WhatsAppMessage } from '@/types';

// Mock data for demonstration
const mockMessages: WhatsAppMessage[] = [
  {
    id: '1',
    phone: '(11) 99999-1234',
    client: 'Maria Silva',
    direction: 'received',
    text: 'Olá, gostaria de agendar uma consulta para amanhã.',
    intent: 'Agendamento',
    dateTime: new Date('2025-01-14T10:30:00'),
  },
  {
    id: '2',
    phone: '(11) 99999-1234',
    client: 'Maria Silva',
    direction: 'sent',
    text: 'Olá Maria! Temos horários disponíveis às 9h e às 14h. Qual prefere?',
    intent: 'Resposta',
    dateTime: new Date('2025-01-14T10:32:00'),
  },
  {
    id: '3',
    phone: '(11) 98888-5678',
    client: 'João Santos',
    direction: 'received',
    text: 'Preciso remarcar minha consulta de quinta-feira.',
    intent: 'Remarcação',
    dateTime: new Date('2025-01-14T09:15:00'),
  },
  {
    id: '4',
    phone: '(11) 97777-9012',
    client: 'Ana Oliveira',
    direction: 'received',
    text: 'Qual o valor da consulta particular?',
    intent: 'Informação',
    dateTime: new Date('2025-01-13T16:45:00'),
  },
  {
    id: '5',
    phone: '(11) 97777-9012',
    client: 'Ana Oliveira',
    direction: 'sent',
    text: 'Olá Ana! A consulta particular custa R$ 250,00. Deseja agendar?',
    intent: 'Resposta',
    dateTime: new Date('2025-01-13T16:50:00'),
  },
  {
    id: '6',
    phone: '(11) 96666-3456',
    client: 'Carlos Ferreira',
    direction: 'received',
    text: 'Preciso cancelar minha consulta de hoje.',
    intent: 'Cancelamento',
    dateTime: new Date('2025-01-13T08:00:00'),
  },
  {
    id: '7',
    phone: '(11) 95555-7890',
    client: 'Fernanda Costa',
    direction: 'received',
    text: 'Vocês aceitam convênio Unimed?',
    intent: 'Informação',
    dateTime: new Date('2025-01-12T14:20:00'),
  },
  {
    id: '8',
    phone: '(11) 95555-7890',
    client: 'Fernanda Costa',
    direction: 'sent',
    text: 'Sim, aceitamos Unimed! Posso agendar sua consulta?',
    intent: 'Resposta',
    dateTime: new Date('2025-01-12T14:25:00'),
  },
];

const intents = ['Todos', 'Agendamento', 'Remarcação', 'Cancelamento', 'Informação', 'Resposta', 'Confirmação'];

export function Messages() {
  const [messages] = useState<WhatsAppMessage[]>(mockMessages);
  const [phoneFilter, setPhoneFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [intentFilter, setIntentFilter] = useState<string>('Todos');
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  const clearFilters = () => {
    setPhoneFilter('');
    setClientFilter('');
    setDirectionFilter('all');
    setIntentFilter('Todos');
    setDateFilter(undefined);
  };

  const hasActiveFilters = phoneFilter || clientFilter || directionFilter !== 'all' || intentFilter !== 'Todos' || dateFilter;

  const filteredMessages = messages.filter((msg) => {
    if (phoneFilter && !msg.phone.toLowerCase().includes(phoneFilter.toLowerCase())) {
      return false;
    }
    if (clientFilter && !msg.client.toLowerCase().includes(clientFilter.toLowerCase())) {
      return false;
    }
    if (directionFilter !== 'all' && msg.direction !== directionFilter) {
      return false;
    }
    if (intentFilter !== 'Todos' && msg.intent !== intentFilter) {
      return false;
    }
    if (dateFilter) {
      const msgDate = format(msg.dateTime, 'yyyy-MM-dd');
      const filterDate = format(dateFilter, 'yyyy-MM-dd');
      if (msgDate !== filterDate) {
        return false;
      }
    }
    return true;
  });

  return (
    <MainLayout title="Mensagens" subtitle="Gerencie as mensagens recebidas pelo WhatsApp">
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Filter className="w-4 h-4" />
            Filtros
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Telefone</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar telefone..."
                  value={phoneFilter}
                  onChange={(e) => setPhoneFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Cliente</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Direção</label>
              <Select value={directionFilter} onValueChange={setDirectionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="received">Recebidas</SelectItem>
                  <SelectItem value="sent">Enviadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Intenção</label>
              <Select value={intentFilter} onValueChange={setIntentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  {intents.map((intent) => (
                    <SelectItem key={intent} value={intent}>
                      {intent}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Data</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateFilter && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter ? format(dateFilter, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Messages Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead className="w-[140px]">Telefone</TableHead>
                <TableHead className="w-[160px]">Cliente</TableHead>
                <TableHead className="w-[100px]">Direção</TableHead>
                <TableHead>Texto</TableHead>
                <TableHead className="w-[120px]">Intenção</TableHead>
                <TableHead className="w-[160px]">Data e Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMessages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    Nenhuma mensagem encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredMessages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{message.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {message.phone}
                    </TableCell>
                    <TableCell>{message.client}</TableCell>
                    <TableCell>
                      <Badge
                        variant={message.direction === 'received' ? 'default' : 'secondary'}
                        className={cn(
                          "gap-1",
                          message.direction === 'received' 
                            ? "bg-green-100 text-green-700 hover:bg-green-100" 
                            : "bg-blue-100 text-blue-700 hover:bg-blue-100"
                        )}
                      >
                        {message.direction === 'received' ? (
                          <ArrowDownLeft className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        {message.direction === 'received' ? 'Recebida' : 'Enviada'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[300px] truncate" title={message.text}>
                      {message.text}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{message.intent}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(message.dateTime, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="text-sm text-muted-foreground">
          Exibindo {filteredMessages.length} de {messages.length} mensagens
        </div>
      </div>
    </MainLayout>
  );
}
