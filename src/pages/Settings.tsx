import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Clock, Bell, Shield } from 'lucide-react';

export function Settings() {
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
                <CardDescription>
                  Informações gerais sobre a clínica ou consultório
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Nome da Clínica</Label>
                    <Input defaultValue="MedAgenda Clínica" />
                  </div>
                  <div>
                    <Label>CNPJ</Label>
                    <Input defaultValue="12.345.678/0001-90" />
                  </div>
                  <div>
                    <Label>Telefone</Label>
                    <Input defaultValue="(11) 3456-7890" />
                  </div>
                  <div className="col-span-2">
                    <Label>Endereço</Label>
                    <Input defaultValue="Av. Paulista, 1000 - Bela Vista, São Paulo - SP" />
                  </div>
                </div>
                <Button className="mt-4">Salvar Alterações</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Agenda</CardTitle>
                <CardDescription>
                  Defina os horários de funcionamento e intervalos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Horário de Início</Label>
                    <Input type="time" defaultValue="07:00" />
                  </div>
                  <div>
                    <Label>Horário de Término</Label>
                    <Input type="time" defaultValue="19:00" />
                  </div>
                  <div>
                    <Label>Intervalo entre consultas (min)</Label>
                    <Input type="number" defaultValue="15" />
                  </div>
                  <div>
                    <Label>Duração padrão da consulta (min)</Label>
                    <Input type="number" defaultValue="30" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Dias de Funcionamento</h4>
                  <div className="grid grid-cols-7 gap-2">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                      <div key={day} className="flex flex-col items-center gap-2">
                        <Label className="text-xs">{day}</Label>
                        <Switch defaultChecked={index > 0 && index < 6} />
                      </div>
                    ))}
                  </div>
                </div>

                <Button>Salvar Alterações</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>
                  Configure lembretes e alertas do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium">Lembrete por SMS</p>
                    <p className="text-sm text-muted-foreground">
                      Enviar lembrete de consulta por SMS
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium">Lembrete por Email</p>
                    <p className="text-sm text-muted-foreground">
                      Enviar lembrete de consulta por email
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium">Confirmação de agendamento</p>
                    <p className="text-sm text-muted-foreground">
                      Solicitar confirmação do paciente
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Notificação de falta</p>
                    <p className="text-sm text-muted-foreground">
                      Alertar sobre pacientes que faltaram
                    </p>
                  </div>
                  <Switch />
                </div>
                <Button className="mt-4">Salvar Alterações</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Segurança</CardTitle>
                <CardDescription>
                  Configurações de segurança e acesso
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium">Autenticação de dois fatores</p>
                    <p className="text-sm text-muted-foreground">
                      Adicione uma camada extra de segurança
                    </p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="font-medium">Sessão automática</p>
                    <p className="text-sm text-muted-foreground">
                      Desconectar após 30 minutos de inatividade
                    </p>
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
