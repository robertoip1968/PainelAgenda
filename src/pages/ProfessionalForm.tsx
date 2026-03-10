import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, User, Clock, Stethoscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useProfessional, useSaveProfessional, useSpecialties } from '@/hooks/useApiData';
import { ProfessionalArea } from '@/types';

const WEEK_DAYS = [
  { id: 'monday', label: 'Segunda' },
  { id: 'tuesday', label: 'Terça' },
  { id: 'wednesday', label: 'Quarta' },
  { id: 'thursday', label: 'Quinta' },
  { id: 'friday', label: 'Sexta' },
  { id: 'saturday', label: 'Sábado' },
];

const AREAS: { value: ProfessionalArea; label: string }[] = [
  { value: 'medica', label: 'Médica' },
  { value: 'odontologica', label: 'Odontológica' },
  { value: 'laboratorial', label: 'Laboratorial' },
];

type ProfessionalFormState = {
  full_name: string;
  area: string;
  specialty_id: string;
  numero_conselho: string;
  phone: string;
  email: string;
  consultationDuration: string;
  workDays: string[];
  startTime: string;
  endTime: string;
  lunchStart: string;
  lunchEnd: string;
};

const emptyForm: ProfessionalFormState = {
  full_name: '',
  area: '',
  specialty_id: '',
  numero_conselho: '',
  phone: '',
  email: '',
  consultationDuration: '30',
  workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  startTime: '08:00',
  endTime: '18:00',
  lunchStart: '12:00',
  lunchEnd: '13:00',
};

export function ProfessionalForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const isEditing = Boolean(id);
  const professionalId = id ? Number(id) : 0;

  const [formData, setFormData] = useState<ProfessionalFormState>(emptyForm);

  const { data: professional, isLoading: isLoadingProfessional } = useProfessional(professionalId);
  const { data: specialties = [] } = useSpecialties();
  const saveProfessional = useSaveProfessional();

  useEffect(() => {
    if (!isEditing) {
      setFormData(emptyForm);
      return;
    }

    if (professional) {
      setFormData({
        full_name: professional.full_name || '',
        area: professional.area || '',
        specialty_id: professional.specialty_id ? String(professional.specialty_id) : '',
        numero_conselho: professional.numero_conselho || '',
        phone: professional.phone || '',
        email: professional.email || '',
        consultationDuration: '30',
        workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        startTime: '08:00',
        endTime: '18:00',
        lunchStart: '12:00',
        lunchEnd: '13:00',
      });
    }
  }, [isEditing, professional]);

  const updateForm = (field: keyof ProfessionalFormState, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  const activeSpecialties = specialties.filter((s) => s.is_active);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.area) {
      toast({
        title: 'Área obrigatória',
        description: 'Selecione a área do profissional.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.specialty_id) {
      toast({
        title: 'Especialidade obrigatória',
        description: 'Selecione a especialidade do profissional.',
        variant: 'destructive',
      });
      return;
    }

    const email = formData.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      toast({
        title: 'E-mail obrigatório',
        description: 'Preencha o e-mail do profissional.',
        variant: 'destructive',
      });
      return;
    }

    if (!emailRegex.test(email)) {
      toast({
        title: 'E-mail inválido',
        description: 'Informe um endereço de e-mail válido.',
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      ...(isEditing && professionalId ? { id: professionalId } : {}),
      full_name: formData.full_name.trim(),
      area: formData.area as ProfessionalArea,
      specialty_id: Number(formData.specialty_id),
      numero_conselho: formData.numero_conselho.trim(),
      phone: formData.phone.trim(),
      email,
    };

    saveProfessional.mutate(payload, {
      onSuccess: () => {
        toast({
          title: isEditing ? 'Profissional atualizado!' : 'Profissional cadastrado!',
          description: isEditing
            ? 'Os dados do profissional foram atualizados com sucesso.'
            : 'O profissional foi cadastrado com sucesso.',
        });
        navigate('/profissionais');
      },
      onError: (err: any) => {
        toast({
          title: 'Erro ao salvar profissional',
          description: err?.message || 'Não foi possível salvar o profissional.',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <MainLayout
      title={isEditing ? 'Editar Profissional' : 'Novo Profissional'}
      subtitle={isEditing ? 'Atualize os dados do profissional' : 'Preencha os dados do profissional'}
    >
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
                <Label htmlFor="full_name">Nome completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => updateForm('full_name', e.target.value)}
                  placeholder="Dr(a). Nome Completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Área *</Label>
                <Select value={formData.area} onValueChange={(v) => updateForm('area', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    {AREAS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_conselho">Registro Profissional *</Label>
                <Input
                  id="numero_conselho"
                  value={formData.numero_conselho}
                  onChange={(e) => updateForm('numero_conselho', e.target.value)}
                  placeholder="CRM/CRO 00000-UF"
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="specialty_id">Especialidade *</Label>
                <Select value={formData.specialty_id} onValueChange={(v) => updateForm('specialty_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeSpecialties.map((spec) => (
                      <SelectItem key={spec.id} value={String(spec.id)}>
                        {spec.name}
                      </SelectItem>
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
                <Select
                  value={formData.consultationDuration}
                  onValueChange={(v) => updateForm('consultationDuration', v)}
                >
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

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/profissionais')}
            disabled={saveProfessional.isPending || (isEditing && isLoadingProfessional)}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={saveProfessional.isPending || (isEditing && isLoadingProfessional)}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saveProfessional.isPending
              ? 'Salvando...'
              : isEditing
                ? 'Salvar Alterações'
                : 'Salvar Profissional'}
          </Button>
        </div>
      </form>
    </MainLayout>
  );
}
