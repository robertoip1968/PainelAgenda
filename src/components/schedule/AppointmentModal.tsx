import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { professionals, patients } from '@/data/mockData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  selectedTime: string;
  onSave: (data: any) => void;
}

const steps = [
  { id: 1, title: 'Paciente', description: 'Dados do paciente' },
  { id: 2, title: 'Data e Tipo', description: 'Data, horário e tipo' },
  { id: 3, title: 'Agendamento', description: 'Convênio e detalhes' },
];

export function AppointmentModal({
  open,
  onOpenChange,
  selectedDate,
  selectedTime,
  onSave,
}: AppointmentModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    birthDate: '',
    sex: 'M',
    cpf: '',
    phone: '',
    email: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: 'SP',
    zipCode: '',
    hasFinancialResponsible: false,
    financialResponsibleName: '',
    financialResponsibleCpf: '',
    // step 2
    appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
    appointmentTime: selectedTime,
    tipo: 'consultation',
    // step 3
    professionalId: '',
    healthInsurance: '',
    notes: '',
  });

  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    if (patient) {
      setFormData({
        ...formData,
        patientId: patient.id,
        patientName: patient.full_name,
        birthDate: patient.birth_date,
        sex: patient.sex,
        cpf: patient.cpf,
        phone: patient.phone,
        email: patient.email,
        street: patient.street || '',
        number: patient.number || '',
        complement: patient.complement || '',
        neighborhood: patient.neighborhood || '',
        city: patient.city || '',
        state: patient.state_uf || '',
        zipCode: patient.zip_code || '',
        hasFinancialResponsible: false,
        financialResponsibleName: '',
        financialResponsibleCpf: '',
        healthInsurance: patient.insurance_plan_id ? String(patient.insurance_plan_id) : '',
      });
    }
  };

  const handleSubmit = () => {
    onSave(formData);
    onOpenChange(false);
    setCurrentStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Agendar Consulta</DialogTitle>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors",
                  currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : currentStep > step.id
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-medium">
                  {step.id}
                </span>
                <span className="text-sm font-medium">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="w-8 h-px bg-border mx-2" />
              )}
            </div>
          ))}
        </div>

        {/* Date/Time info */}
        <div className="bg-muted/50 rounded-lg p-3 mb-4">
          <p className="text-sm">
            <span className="font-medium">Data:</span>{' '}
            {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            {' • '}
            <span className="font-medium">Horário:</span> {selectedTime}
          </p>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-1">
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <Label>Paciente existente</Label>
                <Select onValueChange={handlePatientSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione ou cadastre novo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.full_name}
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
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    placeholder="Nome do paciente"
                  />
                </div>

                <div>
                  <Label>Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Sexo</Label>
                    <Select
                      value={formData.sex}
                      onValueChange={(value) => setFormData({ ...formData, sex: value as 'M' | 'F' })}
                    >
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
                    <Input
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                <div className="col-span-2">
                  <Label>Logradouro</Label>
                  <Input
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 col-span-2">
                  <div>
                    <Label>Número</Label>
                    <Input
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Complemento</Label>
                    <Input
                      value={formData.complement}
                      onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Bairro</Label>
                  <Input
                    value={formData.neighborhood}
                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label>Cidade</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>UF</Label>
                    <Input
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                </div>

                <div>
                  <Label>Celular</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id="hasFinancialResponsible"
                      checked={formData.hasFinancialResponsible}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, hasFinancialResponsible: checked as boolean })
                      }
                    />
                    <Label htmlFor="hasFinancialResponsible" className="font-normal">
                      Paciente possui Responsável Financeiro (É beneficiário)
                    </Label>
                  </div>
                </div>

                {formData.hasFinancialResponsible && (
                  <>
                    <div>
                      <Label>Nome do Responsável</Label>
                      <Input
                        value={formData.financialResponsibleName}
                        onChange={(e) => setFormData({ ...formData, financialResponsibleName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>CPF do Responsável</Label>
                      <Input
                        value={formData.financialResponsibleCpf}
                        onChange={(e) => setFormData({ ...formData, financialResponsibleCpf: e.target.value })}
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data do Agendamento *</Label>
                  <Input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Horário *</Label>
                  <Input
                    type="time"
                    value={formData.appointmentTime}
                    onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
                  />
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
                      onClick={() => setFormData({ ...formData, tipo: opt.value })}
                      className={cn(
                        "px-4 py-3 rounded-lg border text-sm font-medium transition-colors text-left",
                        formData.tipo === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>Duração estimada</Label>
                <Select
                  onValueChange={() => {}}
                >
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

          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <Label>Profissional *</Label>
                <Select
                  value={formData.professionalId}
                  onValueChange={(value) => setFormData({ ...formData, professionalId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.name} - {prof.specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Convênio</Label>
                <Select
                  value={formData.healthInsurance}
                  onValueChange={(value) => setFormData({ ...formData, healthInsurance: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Particular ou selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Particular</SelectItem>
                    <SelectItem value="Unimed">Unimed</SelectItem>
                    <SelectItem value="Bradesco Saúde">Bradesco Saúde</SelectItem>
                    <SelectItem value="SulAmérica">SulAmérica</SelectItem>
                    <SelectItem value="Amil">Amil</SelectItem>
                    <SelectItem value="NotreDame">NotreDame Intermédica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações adicionais sobre o agendamento..."
                  rows={4}
                />
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t border-border mt-4">
          <Button
            variant="outline"
            onClick={() => {
              if (currentStep > 1) {
                setCurrentStep(currentStep - 1);
              } else {
                onOpenChange(false);
              }
            }}
          >
            {currentStep > 1 ? 'Passo Anterior' : 'Fechar'}
          </Button>

          <Button
            onClick={() => {
              if (currentStep < steps.length) {
                setCurrentStep(currentStep + 1);
              } else {
                handleSubmit();
              }
            }}
          >
            {currentStep < steps.length ? 'Próximo Passo' : 'Salvar Agendamento'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
