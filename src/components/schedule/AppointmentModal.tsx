import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CheckCircle2, User, Calendar, Stethoscope, ClipboardCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { usePatients, useProfessionals, useHealthInsurances, useSpecialties } from '@/hooks/useApiData';

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedTime: string;
  onSave: (data: any) => Promise<void>;
}

const steps = [
  { id: 1, title: 'Paciente', description: 'Dados do paciente' },
  { id: 2, title: 'Data e Tipo', description: 'Data, horário e tipo' },
  { id: 3, title: 'Agendamento', description: 'Profissional e convênio' },
  { id: 4, title: 'Confirmação', description: 'Resumo e confirmação' },
];

const tipoLabels: Record<string, string> = {
  consultation: 'Consulta',
  return: 'Retorno',
  exam: 'Exame',
  procedure: 'Procedimento',
};

function makeInitialFormData(selectedDate: Date, selectedTime: string) {
  return {
    // step 1
    patientId: '',
    patientName: '',
    birthDate: '',
    sex: 'M' as 'M' | 'F',
    cpf: '',
    phone: '',
    email: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: 'SP',
    hasFinancialResponsible: false,
    financialResponsibleName: '',
    financialResponsibleCpf: '',

    // step 2
    appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
    appointmentTime: selectedTime,
    duration: '30',
    tipo: 'consultation',

    // step 3
    professionalId: '',
    healthInsurance: 'particular', // 'particular' ou id do plano (insurance_plans)
    notes: '',
  };
}

export function AppointmentModal({
  open,
  onOpenChange,
  selectedDate,
  selectedTime,
  onSave,
}: AppointmentModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(() => makeInitialFormData(selectedDate, selectedTime));

  const { data: patients = [], isLoading: patientsLoading, error: patientsError } = usePatients();
  const { data: professionals = [], isLoading: professionalsLoading, error: professionalsError } = useProfessionals();
  const { data: healthInsurances = [], isLoading: healthLoading, error: healthError } = useHealthInsurances();
  const { data: specialties = [] } = useSpecialties();

  const specialtiesById = useMemo(() => new Map(specialties.map((s: any) => [s.id, s.name])), [specialties]);

  useEffect(() => {
    if (open) {
      setCurrentStep(1);
      setFormData(makeInitialFormData(selectedDate, selectedTime));
    }
  }, [open, selectedDate, selectedTime]);

  const update = (patch: Partial<typeof formData>) => setFormData((prev) => ({ ...prev, ...patch }));

  const clearPatientFields = () => {
    update({
      patientId: '',
      patientName: '',
      birthDate: '',
      sex: 'M',
      cpf: '',
      phone: '',
      email: '',
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: 'SP',
      hasFinancialResponsible: false,
      financialResponsibleName: '',
      financialResponsibleCpf: '',
      // mantém convênio como particular por padrão quando “novo”
      healthInsurance: 'particular',
    });
  };

  const handlePatientSelect = (value: string) => {
    if (!value) return;

    if (value === '__new') {
      clearPatientFields();
      return;
    }

    if (value.startsWith('__')) return;

    const patient: any = patients.find((p: any) => String(p.id) === String(value));
    if (!patient) return;

    update({
      patientId: String(patient.id),
      patientName: patient.full_name ?? '',
      birthDate: patient.birth_date ?? '',
      sex: (patient.sex as any) ?? 'M',
      cpf: patient.cpf ?? '',
      phone: patient.phone ?? '',
      email: patient.email ?? '',
      zipCode: patient.zip_code ?? '',
      street: patient.street ?? '',
      number: patient.number ?? '',
      complement: patient.complement ?? '',
      neighborhood: patient.neighborhood ?? '',
      city: patient.city ?? '',
      state: patient.state_uf ?? 'SP',
      hasFinancialResponsible: false,
      financialResponsibleName: '',
      financialResponsibleCpf: '',
      healthInsurance: patient.insurance_plan_id ? String(patient.insurance_plan_id) : 'particular',
    });
  };

  const selectedProfessional: any = professionals.find((p: any) => String(p.id) === String(formData.professionalId));

  const selectedInsuranceName = useMemo(() => {
    if (!formData.healthInsurance || formData.healthInsurance === 'particular') return 'Particular';
    const hit: any = healthInsurances.find((h: any) => String(h.id) === String(formData.healthInsurance));
    return hit?.name || '—';
  }, [formData.healthInsurance, healthInsurances]);

  const bannerDateLabel = useMemo(() => {
    const d = formData.appointmentDate ? new Date(`${formData.appointmentDate}T00:00:00`) : selectedDate;
    return format(d, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }, [formData.appointmentDate, selectedDate]);

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!String(formData.patientName || '').trim()) {
        toast.error('Informe o nome do paciente.');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!formData.appointmentDate || !formData.appointmentTime) {
        toast.error('Informe data e horário do agendamento.');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!formData.professionalId) {
        toast.error('Selecione o profissional.');
        return false;
      }
      return true;
    }
    return true;
  };

  const handleClose = () => {
    onOpenChange(false);
    setCurrentStep(1);
  };

  const handleNextOrSubmit = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep < steps.length) {
      setCurrentStep((s) => s + 1);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      handleClose();
    } catch (e: any) {
      // o onSave já deve dar toast de erro; aqui só garante que não feche
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Agendar Consulta</DialogTitle>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center gap-1 mb-4 pb-4 border-b border-border">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors w-full',
                  currentStep === step.id
                    ? 'bg-primary text-primary-foreground'
                    : currentStep > step.id
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <span
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0',
                    currentStep === step.id ? 'bg-white/20' : currentStep > step.id ? 'bg-primary/30' : 'bg-black/10'
                  )}
                >
                  {currentStep > step.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.id}
                </span>
                <span className="text-xs font-medium truncate">{step.title}</span>
              </div>
              {index < steps.length - 1 && <div className="w-4 h-px bg-border flex-shrink-0" />}
            </div>
          ))}
        </div>

        {/* Date/Time info */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <p className="text-sm">
            <span className="font-medium">Data:</span> {bannerDateLabel}
            {' • '}
            <span className="font-medium">Horário:</span> {formData.appointmentTime || selectedTime}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-1">
          {/* STEP 1 */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <Label>Paciente existente</Label>
                <Select value={formData.patientId ? formData.patientId : undefined} onValueChange={handlePatientSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione ou cadastre novo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__new">Cadastrar novo…</SelectItem>

                    {patientsLoading && (
                      <SelectItem value="__loading" disabled>
                        Carregando…
                      </SelectItem>
                    )}

                    {patientsError && (
                      <SelectItem value="__error" disabled>
                        Erro ao carregar pacientes
                      </SelectItem>
                    )}

                    {!patientsLoading &&
                      !patientsError &&
                      patients.map((p: any) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.full_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome completo *</Label>
                  <Input
                    value={formData.patientName}
                    onChange={(e) => update({ patientName: e.target.value })}
                    placeholder="Nome do paciente"
                  />
                </div>

                <div>
                  <Label>Data de Nascimento</Label>
                  <Input type="date" value={formData.birthDate} onChange={(e) => update({ birthDate: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Sexo</Label>
                    <Select value={formData.sex} onValueChange={(value) => update({ sex: value as 'M' | 'F' })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>CPF</Label>
                    <Input value={formData.cpf} onChange={(e) => update({ cpf: e.target.value })} placeholder="000.000.000-00" />
                  </div>
                </div>

                <div>
                  <Label>Celular</Label>
                  <Input value={formData.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="(00) 00000-0000" />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => update({ email: e.target.value })} />
                </div>

                <div className="col-span-2">
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id="hasFinancialResponsible"
                      checked={formData.hasFinancialResponsible}
                      onCheckedChange={(checked) => update({ hasFinancialResponsible: checked as boolean })}
                    />
                    <Label htmlFor="hasFinancialResponsible" className="font-normal">
                      Paciente possui Responsável Financeiro (é beneficiário)
                    </Label>
                  </div>
                </div>

                {formData.hasFinancialResponsible && (
                  <>
                    <div>
                      <Label>Nome do Responsável</Label>
                      <Input
                        value={formData.financialResponsibleName}
                        onChange={(e) => update({ financialResponsibleName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>CPF do Responsável</Label>
                      <Input
                        value={formData.financialResponsibleCpf}
                        onChange={(e) => update({ financialResponsibleCpf: e.target.value })}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data do Agendamento *</Label>
                  <Input type="date" value={formData.appointmentDate} onChange={(e) => update({ appointmentDate: e.target.value })} />
                </div>
                <div>
                  <Label>Horário *</Label>
                  <Input type="time" value={formData.appointmentTime} onChange={(e) => update({ appointmentTime: e.target.value })} />
                </div>
              </div>

              <div>
                <Label>Tipo de Atendimento *</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {[
                    { value: 'consultation', label: 'Consulta' },
                    { value: 'return', label: 'Retorno' },
                    { value: 'exam', label: 'Exame' },
                    { value: 'procedure', label: 'Procedimento' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => update({ tipo: opt.value })}
                      className={cn(
                        'px-4 py-3 rounded-lg border text-sm font-medium transition-colors text-left',
                        formData.tipo === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Duração estimada</Label>
                <Select value={formData.duration} onValueChange={(value) => update({ duration: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a duração..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">60 minutos</SelectItem>
                    <SelectItem value="90">90 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <Label>Profissional *</Label>
                <Select value={formData.professionalId ? formData.professionalId : undefined} onValueChange={(value) => update({ professionalId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionalsLoading && (
                      <SelectItem value="__loading" disabled>
                        Carregando…
                      </SelectItem>
                    )}

                    {professionalsError && (
                      <SelectItem value="__error" disabled>
                        Erro ao carregar profissionais
                      </SelectItem>
                    )}

                    {!professionalsLoading &&
                      !professionalsError &&
                      professionals.map((prof: any) => (
                        <SelectItem key={prof.id} value={String(prof.id)}>
                          {prof.full_name}
                          {prof.specialty_id ? ` - ${specialtiesById.get(prof.specialty_id) || ''}` : ''}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Convênio</Label>
                <Select value={formData.healthInsurance} onValueChange={(value) => update({ healthInsurance: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Particular ou selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="particular">Particular</SelectItem>

                    {healthLoading && (
                      <SelectItem value="__loading" disabled>
                        Carregando convênios…
                      </SelectItem>
                    )}

                    {healthError && (
                      <SelectItem value="__error" disabled>
                        Erro ao carregar convênios
                      </SelectItem>
                    )}

                    {!healthLoading &&
                      !healthError &&
                      healthInsurances.map((h: any) => (
                        <SelectItem key={h.id} value={String(h.id)}>
                          {h.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => update({ notes: e.target.value })}
                  placeholder="Informações adicionais sobre o agendamento..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-muted-foreground">Revise os dados antes de confirmar o agendamento.</p>

              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <User className="w-4 h-4" />
                  Paciente
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nome:</span>
                    <p className="font-medium">{formData.patientName || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CPF:</span>
                    <p className="font-medium">{formData.cpf || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Celular:</span>
                    <p className="font-medium">{formData.phone || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{formData.email || '—'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <Calendar className="w-4 h-4" />
                  Data e Tipo
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Data:</span>
                    <p className="font-medium">
                      {formData.appointmentDate ? format(new Date(`${formData.appointmentDate}T00:00:00`), 'dd/MM/yyyy') : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Horário:</span>
                    <p className="font-medium">{formData.appointmentTime || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>
                    <p className="font-medium">{tipoLabels[formData.tipo] || formData.tipo}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duração:</span>
                    <p className="font-medium">{formData.duration ? `${formData.duration} min` : '—'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <Stethoscope className="w-4 h-4" />
                  Profissional e Convênio
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Profissional:</span>
                    <p className="font-medium">{selectedProfessional?.full_name || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Especialidade:</span>
                    <p className="font-medium">
                      {selectedProfessional?.specialty_id ? specialtiesById.get(selectedProfessional.specialty_id) || '—' : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Convênio:</span>
                    <p className="font-medium">{selectedInsuranceName}</p>
                  </div>
                </div>

                {formData.notes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Observações:</span>
                    <p className="font-medium mt-0.5">{formData.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/20 p-4">
                <ClipboardCheck className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-sm text-primary font-medium">
                  Ao confirmar, o agendamento será registrado.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t border-border mt-4">
          <Button
            variant="outline"
            disabled={isSaving}
            onClick={() => {
              if (currentStep > 1) setCurrentStep((s) => s - 1);
              else handleClose();
            }}
          >
            {currentStep > 1 ? 'Passo Anterior' : 'Fechar'}
          </Button>

          <Button disabled={isSaving} onClick={handleNextOrSubmit}>
            {isSaving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando…
              </span>
            ) : currentStep < steps.length ? (
              'Próximo Passo'
            ) : (
              'Confirmar Agendamento'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
