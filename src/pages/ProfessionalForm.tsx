import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, User, Clock, Stethoscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SPECIALTIES = [
  'Cardiologia',
  'Clínico Geral',
  'Dermatologia',
  'Endocrinologia',
  'Gastroenterologia',
  'Ginecologia',
  'Neurologia',
  'Oftalmologia',
  'Ortopedia',
  'Otorrinolaringologia',
  'Pediatria',
  'Psiquiatria',
  'Urologia',
  'Odontologia Geral',
  'Ortodontia',
  'Endodontia',
  'Periodontia',
  'Implantodontia',
  'Radiologia',
  'Ultrassonografia',
  'Tomografia',
  'Ressonância Magnética',
  'Análises Clínicas',
];

const WEEK_DAYS = [
  { id: 'monday', label: 'Segunda' },
  { id: 'tuesday', label: 'Terça' },
  { id: 'wednesday', label: 'Quarta' },
  { id: 'thursday', label: 'Quinta' },
  { id: 'friday', label: 'Sexta' },
  { id: 'saturday', label: 'Sábado' },
];

export function ProfessionalForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  
  const [formData, setFormData] = useState({
    name: '',
    specialty: '',
    crm: '',
    cro: '',
    phone: '',
    email: '',
    consultationDuration: '30',
    workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as string[],
    startTime: '08:00',
    endTime: '18:00',
    lunchStart: '12:00',
    lunchEnd: '13:00',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Profissional cadastrado!",
        description: "O profissional foi cadastrado com sucesso.",
      });
      navigate('/profissionais');
    }, 1000);
  };

  const updateForm = (field: string, value: string | string[]) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleWorkDay = (day: string) => {
    const newDays = formData.workDays.includes(day)
      ? formData.workDays.filter((d) => d !== day)
      : [...formData.workDays, day];
    updateForm('workDays', newDays);
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  return (
    <MainLayout title="Novo Profissional" subtitle="Preencha os dados do profissional">
      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => navigate('/profissionais')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>

        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Dados do Profissional</CardTitle>
            </div>
            <CardDescription>Informações básicas e registro profissional</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="name">Nome completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  placeholder="Dr(a). Nome Completo"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registration">Registro Profissional *</Label>
                <Input
                  id="registration"
                  value={formData.crm}
                  onChange={(e) => updateForm('crm', e.target.value)}
                  placeholder="CRM/CRO-UF 00000"
                  required
                />
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="specialty">Especialidade *</Label>
                <Select value={formData.specialty} onValueChange={(v) => updateForm('specialty', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((spec) => (
                      <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateForm('phone', formatPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  required
                />
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  placeholder="profissional@email.com"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações da Agenda */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Configurações da Agenda</CardTitle>
            </div>
            <CardDescription>Horários de atendimento e duração das consultas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Dias de Atendimento</Label>
              <div className="flex flex-wrap gap-2">
                {WEEK_DAYS.map((day) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.id}
                      checked={formData.workDays.includes(day.id)}
                      onCheckedChange={() => toggleWorkDay(day.id)}
                    />
                    <Label htmlFor={day.id} className="cursor-pointer text-sm">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Início do Expediente</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => updateForm('startTime', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime">Fim do Expediente</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => updateForm('endTime', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lunchStart">Início do Almoço</Label>
                <Input
                  id="lunchStart"
                  type="time"
                  value={formData.lunchStart}
                  onChange={(e) => updateForm('lunchStart', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lunchEnd">Fim do Almoço</Label>
                <Input
                  id="lunchEnd"
                  type="time"
                  value={formData.lunchEnd}
                  onChange={(e) => updateForm('lunchEnd', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duração Padrão</Label>
                <Select value={formData.consultationDuration} onValueChange={(v) => updateForm('consultationDuration', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="20">20 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Serviços */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Serviços</CardTitle>
            </div>
            <CardDescription>Tipos de atendimento realizados pelo profissional</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {['Consulta', 'Retorno', 'Exame', 'Procedimento'].map((service) => (
                <div key={service} className="flex items-center space-x-2">
                  <Checkbox id={service} defaultChecked />
                  <Label htmlFor={service} className="cursor-pointer">
                    {service}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/profissionais')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2">
            <Save className="w-4 h-4" />
            {isLoading ? 'Salvando...' : 'Salvar Profissional'}
          </Button>
        </div>
      </form>
    </MainLayout>
  );
}
