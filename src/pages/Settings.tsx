import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Clock, Bell, Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useClinicSettings,
  useSaveClinicSettings,
  useAgendaSettings,
  useSaveAgendaSettings,
} from '@/hooks/useApiData';

type ClinicForm = {
  clinic_name: string;
  cnpj: string;
  phone: string;
  address: string;
};

type AgendaForm = {
  weekday_start_time: string;
  weekday_end_time: string;
  saturday_start_time: string;
  saturday_end_time: string;
  interval_minutes: number;
  default_duration_minutes: number;
  open_sun: boolean;
  open_mon: boolean;
  open_tue: boolean;
  open_wed: boolean;
  open_thu: boolean;
  open_fri: boolean;
  open_sat: boolean;
};

const defaultClinic: ClinicForm = {
  clinic_name: '',
  cnpj: '',
  phone: '',
  address: '',
};

const defaultAgenda: AgendaForm = {
  weekday_start_time: '07:00',
  weekday_end_time: '19:00',
  saturday_start_time: '07:00',
  saturday_end_time: '19:00',
  interval_minutes: 15,
  default_duration_minutes: 30,
  open_sun: false,
  open_mon: true,
  open_tue: true,
  open_wed: true,
  open_thu: true,
  open_fri: true,
  open_sat: false,
};

export function Settings() {
  const { toast } = useToast();

  const clinicQ = useClinicSettings();
  const agendaQ = useAgendaSettings();

  const saveClinic = useSaveClinicSettings();
  const saveAgenda = useSaveAgendaSettings();

  const [clinic, setClinic] = useState<ClinicForm>(defaultClinic);
  const [agenda, setAgenda] = useState<AgendaForm>(defaultAgenda);

  useEffect(() => {
    if (clinicQ.data) {
      setClinic({
        clinic_name: clinicQ.data.clinic_name ?? '',
        cnpj: clinicQ.data.cnpj ?? '',
        phone: clinicQ.data.phone ?? '',
        address: clinicQ.data.address ?? '',
      });
    }
  }, [clinicQ.data]);

  useEffect(() => {
    if (agendaQ.data) {
      setAgenda({
        weekday_start_time: agendaQ.data.weekday_start_time ?? '07:00',
        weekday_end_time: agendaQ.data.weekday_end_time ?? '19:00',
        saturday_start_time: agendaQ.data.saturday_start_time ?? (agendaQ.data.weekday_start_time ?? '07:00'),
        saturday_end_time: agendaQ.data.saturday_end_time ?? (agendaQ.data.weekday_end_time ?? '19:00'),
        interval_minutes: Number(agendaQ.data.interval_minutes ?? 15),
        default_duration_minutes: Number(agendaQ.data.default_duration_minutes ?? 30),
        open_sun: Boolean(agendaQ.data.open_sun),
        open_mon: Boolean(agendaQ.data.open_mon),
        open_tue: Boolean(agendaQ.data.open_tue),
        open_wed: Boolean(agendaQ.data.open_wed),
        open_thu: Boolean(agendaQ.data.open_thu),
        open_fri: Boolean(agendaQ.data.open_fri),
        open_sat: Boolean(agendaQ.data.open_sat),
      });
    }
  }, [agendaQ.data]);

  const isLoading = clinicQ.isLoading || agendaQ.isLoading;
  const hasError = clinicQ.error || agendaQ.error;

  const handleSaveClinic = () => {
    if (!clinic.clinic_name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe o nome da clínica.',
        variant: 'destructive',
      });
      return;
    }

    saveClinic.mutate(
      {
        clinic_name: clinic.clinic_name.trim(),
        cnpj: clinic.cnpj.trim(),
        phone: clinic.phone.trim(),
        address: clinic.address.trim(),
      },
      {
        onSuccess: () =>
          toast({ title: 'Configurações salvas!', description: 'Dados da clínica atualizados com sucesso.' }),
        onError: (err: any) =>
          toast({
            title: 'Erro ao salvar',
            description: err?.message || 'Não foi possível salvar as configurações da clínica.',
            variant: 'destructive',
          }),
      }
    );
  };

  const handleSaveAgenda = () => {
    if (!agenda.weekday_start_time || !agenda.weekday_end_time) {
      toast({
        title: 'Horário inválido',
        description: 'Informe horário de início e término (Seg–Sex).',
        variant: 'destructive',
      });
      return;
    }

    if (agenda.open_sat && (!agenda.saturday_start_time || !agenda.saturday_end_time)) {
      toast({
        title: 'Horário de sábado inválido',
        description: 'Informe horário de início e término do sábado.',
        variant: 'destructive',
      });
      return;
    }

    saveAgenda.mutate(
      {
        weekday_start_time: agenda.weekday_start_time,
        weekday_end_time: agenda.weekday_end_time,
        saturday_start_time: agenda.open_sat ? agenda.saturday_start_time : agenda.weekday_start_time,
        saturday_end_time: agenda.open_sat ? agenda.saturday_end_time : agenda.weekday_end_time,
        interval_minutes: Number(agenda.interval_minutes),
        default_duration_minutes: Number(agenda.default_duration_minutes),
        open_sun: agenda.open_sun,
        open_mon: agenda.open_mon,
        open_tue: agenda.open_tue,
        open_wed: agenda.open_wed,
        open_thu: agenda.open_thu,
        open_fri: agenda.open_fri,
        open_sat: agenda.open_sat,
      },
      {
        onSuccess: () =>
          toast({ title: 'Configurações salvas!', description: 'Configurações da agenda atualizadas com sucesso.' }),
        onError: (err: any) =>
          toast({
            title: 'Erro ao salvar',
            description: err?.message || 'Não foi possível salvar as configurações da agenda.',
            variant: 'destructive',
          }),
      }
    );
  };

  if (isLoading) {
    return (
      <MainLayout title="Configurações" subtitle="Gerencie as configurações do sistema">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (hasError) {
    const msg =
      (clinicQ.error as any)?.message || (agendaQ.error as any)?.message || 'Erro ao carregar configurações.';
    return (
      <MainLayout title="Configurações" subtitle="Erro ao carregar">
        <div className="text-center py-12 text-destructive">
          <p>{msg}</p>
          <p className="text-sm text-muted-foreground mt-2">Verifique se a API backend está rodando.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Configurações" subtitle="Gerencie as configurações do sistema">
      <div className="max-w-4xl animate-fade-in">
        <Tabs defaultValue="clinic" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="clinic" className="gap-2">
              <Building2 className="w-4 h-4" />
              Clínica
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Clock className="w-4 h-4" />
              Agenda
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="w-4 h-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              Segurança
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clinic">
            <Card>
              <CardHeader>
                <CardTitle>Dados da Clínica</CardTitle>
                <CardDescription>Informações gerais sobre a clínica ou consultório</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Nome da Clínica</Label>
                    <Input
                      value={clinic.clinic_name}
                      onChange={(e) => setClinic({ ...clinic, clinic_name: e.target.value })}
                      placeholder="Nome da clínica"
                    />
                  </div>
                  <div>
                    <Label>CNPJ</Label>
                    <Input
                      value={clinic.cnpj}
                      onChange={(e) => setClinic({ ...clinic, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input
                      value={clinic.phone}
                      onChange={(e) => setClinic({ ...clinic, phone: e.target.value })}
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Endereço</Label>
                    <Input
                      value={clinic.address}
                      onChange={(e) => setClinic({ ...clinic, address: e.target.value })}
                      placeholder="Endereço completo"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveClinic} disabled={saveClinic.isPending}>
                  {saveClinic.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Agenda</CardTitle>
                <CardDescription>Defina os horários de funcionamento e intervalos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Horário de Início (Seg–Sex)</Label>
                    <Input
                      type="time"
                      value={agenda.weekday_start_time}
                      onChange={(e) => setAgenda({ ...agenda, weekday_start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Horário de Término (Seg–Sex)</Label>
                    <Input
                      type="time"
                      value={agenda.weekday_end_time}
                      onChange={(e) => setAgenda({ ...agenda, weekday_end_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Intervalo entre consultas (min)</Label>
                    <Input
                      type="number"
                      value={agenda.interval_minutes}
                      onChange={(e) => setAgenda({ ...agenda, interval_minutes: Number(e.target.value) })}
                      min={0}
                    />
                  </div>
                  <div>
                    <Label>Duração padrão da consulta (min)</Label>
                    <Input
                      type="number"
                      value={agenda.default_duration_minutes}
                      onChange={(e) => setAgenda({ ...agenda, default_duration_minutes: Number(e.target.value) })}
                      min={1}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Dias de Funcionamento</h4>

                  <div className="grid grid-cols-7 gap-2">
                    {[
                      { k: 'open_sun', label: 'Dom' },
                      { k: 'open_mon', label: 'Seg' },
                      { k: 'open_tue', label: 'Ter' },
                      { k: 'open_wed', label: 'Qua' },
                      { k: 'open_thu', label: 'Qui' },
                      { k: 'open_fri', label: 'Sex' },
                      { k: 'open_sat', label: 'Sáb' },
                    ].map((d) => (
                      <div key={d.k} className="flex flex-col items-center gap-2">
                        <Label className="text-xs">{d.label}</Label>
                        <Switch
                          checked={(agenda as any)[d.k]}
                          onCheckedChange={(v) => {
                            if (d.k === 'open_sat') {
                              // ao ligar sábado, copia horários da semana como base
                              if (v) {
                                setAgenda({
                                  ...agenda,
                                  open_sat: true,
                                  saturday_start_time: agenda.saturday_start_time || agenda.weekday_start_time,
                                  saturday_end_time: agenda.saturday_end_time || agenda.weekday_end_time,
                                });
                              } else {
                                setAgenda({ ...agenda, open_sat: false });
                              }
                            } else {
                              setAgenda({ ...agenda, [d.k]: v } as any);
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {agenda.open_sat && (
                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                    <div>
                      <Label>Horário de Início (Sábado)</Label>
                      <Input
                        type="time"
                        value={agenda.saturday_start_time}
                        onChange={(e) => setAgenda({ ...agenda, saturday_start_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Horário de Término (Sábado)</Label>
                      <Input
                        type="time"
                        value={agenda.saturday_end_time}
                        onChange={(e) => setAgenda({ ...agenda, saturday_end_time: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                <Button onClick={handleSaveAgenda} disabled={saveAgenda.isPending}>
                  {saveAgenda.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ainda mock */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>Configure lembretes e alertas do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium">Lembrete por SMS</p>
                    <p className="text-sm text-muted-foreground">Enviar lembrete de consulta por SMS</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium">Lembrete por Email</p>
                    <p className="text-sm text-muted-foreground">Enviar lembrete de consulta por email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium">Confirmação de agendamento</p>
                    <p className="text-sm text-muted-foreground">Solicitar confirmação do paciente</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Notificação de falta</p>
                    <p className="text-sm text-muted-foreground">Alertar sobre pacientes que faltaram</p>
                  </div>
                  <Switch />
                </div>
                <Button className="mt-4">Salvar Alterações</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ainda mock */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>Configurações de segurança e acesso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium">Autenticação de dois fatores</p>
                    <p className="text-sm text-muted-foreground">Adicione uma camada extra de segurança</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium">Sessão automática</p>
                    <p className="text-sm text-muted-foreground">Desconectar após 30 minutos de inatividade</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2 pt-4">
                  <Label>Alterar Senha</Label>
                  <Input type="password" placeholder="Senha atual" />
                  <Input type="password" placeholder="Nova senha" />
                  <Input type="password" placeholder="Confirmar nova senha" />
                </div>
                <Button className="mt-4">Atualizar Senha</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
