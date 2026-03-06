import { useMemo, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MiniCalendar } from '@/components/schedule/MiniCalendar';
import { StatusLegend } from '@/components/schedule/StatusLegend';
import { TimeSlotGrid } from '@/components/schedule/TimeSlotGrid';
import { ProfessionalTabs } from '@/components/schedule/ProfessionalTabs';
import { AppointmentModal } from '@/components/schedule/AppointmentModal';
import { Button } from '@/components/ui/button';
import {
  useProfessionals,
  useAppointments,
  useUpdateAppointmentStatus,
  useSaveAppointment,
  useSavePatient,
  useHealthInsurances,
} from '@/hooks/useApiData';
import { Appointment, AppointmentStatus } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Search, Printer, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function Agenda() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data: professionals = [] } = useProfessionals();
  const { data: healthInsurances = [] } = useHealthInsurances();

  const { data: allAppointments = [], isLoading } = useAppointments({
    date: dateStr,
    ...(selectedProfessional ? { professional_id: Number(selectedProfessional) } : {}),
  });

  const updateStatus = useUpdateAppointmentStatus();
  const saveAppointment = useSaveAppointment();
  const savePatient = useSavePatient();

  const professionalsById = useMemo(() => {
    return new Map(professionals.map((p) => [p.id, p]));
  }, [professionals]);

  const healthById = useMemo(() => {
    // ids podem ser string no front, mas no BD normalmente é bigint
    return new Map(
      healthInsurances.map((h) => [Number(h.id), h])
    );
  }, [healthInsurances]);

  const normalizeStatus = (s: any): AppointmentStatus => {
    const allowed: AppointmentStatus[] = ['waiting','confirmed','queue','in-progress','completed','absent'];
    return allowed.includes(s) ? s : 'waiting';
  };

  const appointmentsForUI = useMemo(() => {
    return allAppointments.map((a) => {
      const inicio = a.inicio ? new Date(a.inicio) : null;

      const time = (a as any).time || (inicio ? format(inicio, 'HH:mm') : '');
      const date = (a as any).date || (inicio ? format(inicio, 'yyyy-MM-dd') : dateStr);

      const profId = (a as any).professional_id ?? (a as any).profissional_id;
      const professionalName =
        (a as any).professionalName ||
        (profId ? professionalsById.get(Number(profId))?.full_name : undefined);

      const convenioId = (a as any).convenio_id ?? (a as any).insurance_plan_id;
      const healthInsurance =
        (a as any).healthInsurance ||
        (convenioId ? healthById.get(Number(convenioId))?.name : undefined);

      return {
        ...a,
        date,
        time,
        professional_id: profId ? Number(profId) : a.professional_id,
        professionalName,
        healthInsurance,
        status: normalizeStatus(a.status),
      } as Appointment;
    });
  }, [allAppointments, dateStr, professionalsById, healthById]);

  const handleSlotClick = (time: string, appointment?: Appointment) => {
    setSelectedTime(time);
    setSelectedAppointment(appointment || null);
    if (!appointment) setModalOpen(true);
  };

  const handleStatusChange = (appointmentId: string, newStatus: AppointmentStatus) => {
    updateStatus.mutate(
      { id: appointmentId, status: newStatus },
      {
        onSuccess: () => {
          setSelectedAppointment((prev) =>
            prev?.id === appointmentId ? { ...prev, status: newStatus } : prev
          );
        },
        onError: (err: any) => toast.error(`Erro: ${err?.message ?? err}`),
      }
    );
  };

  // Recebe o formData do modal e salva no BD (cria paciente se necessário)
  const handleSaveAppointment = async (data: any) => {
    try {
      // 1) Cliente (cir.clients)
      let clientId: number | undefined = data.patientId ? Number(data.patientId) : undefined;
      let nome: string = String(data.patientName ?? '').trim();

      // telefone SEMPRE obrigatório (appointments.cliente_telefone é NOT NULL)
      let telefone: string = String(
        data.phone ?? data.celular ?? data.telefone ?? data.cliente_telefone ?? ''
      ).trim();

      if (!nome) {
        toast.error('Informe o nome do paciente.');
        return;
      }

      if (!telefone) {
        toast.error('Informe o celular do paciente (obrigatório).');
        return;
      }

      // 2) Se não selecionou cliente existente, cria no endpoint /patients (mapeado para cir.clients)
      if (!clientId) {
        const created = await savePatient.mutateAsync({
          full_name: nome,
          birth_date: data.birthDate || null,
          sex: data.sex || 'M',
          cpf: data.cpf || null,
          phone: telefone, // garante que o cadastro salva com telefone
          email: data.email || null,
          zip_code: data.zipCode || null,
          street: data.street || null,
          number: data.number || null,
          complement: data.complement || null,
          neighborhood: data.neighborhood || null,
          city: data.city || null,
          state_uf: data.state || null,
          insurance_plan_id:
            data.healthInsurance && data.healthInsurance !== 'particular'
              ? Number(data.healthInsurance)
              : null,
          is_active: true,
        } as any);

        clientId = Number(created?.id);
        nome = String(created?.full_name ?? nome).trim();

        // pega o telefone que ficou gravado no cliente (preferência), senão mantém o original
        telefone = String(created?.phone ?? telefone).trim();

        if (!clientId) {
          toast.error('Não consegui obter o ID do cliente criado.');
          return;
        }

        if (!telefone) {
          toast.error('O cadastro do cliente ficou sem telefone. Verifique o campo phone em cir.clients.');
          return;
        }
      }

      // 3) Data/hora
      if (!data.appointmentDate || !data.appointmentTime) {
        toast.error('Informe data e horário do agendamento.');
        return;
      }

      const start = new Date(`${data.appointmentDate}T${data.appointmentTime}:00`);
      const durationMin = parseInt(data.duration || '30', 10) || 30;
      const end = new Date(start.getTime() + durationMin * 60_000);

      // 4) Profissional
      const professionalId = data.professionalId ? Number(data.professionalId) : null;
      if (!professionalId) {
        toast.error('Selecione um profissional.');
        return;
      }

      // 5) Payload alinhado com cir.appointments
      const payload: any = {
        client_id: clientId,
        cliente_nome: nome,
        cliente_telefone: telefone,
        phone: telefone, // redundância útil (backend já aceita)

        tipo: data.tipo || 'consultation',
        inicio: start.toISOString(),
        fim: end.toISOString(),

        professional_id: professionalId,
        service_id: null,

        insurance_plan_id:
          data.healthInsurance && data.healthInsurance !== 'particular'
            ? Number(data.healthInsurance)
            : null,

        observacao: data.notes || null,
        status: 'scheduled',
      };

      await saveAppointment.mutateAsync(payload);

      toast.success('Agendamento realizado com sucesso!');
      setModalOpen(false);
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err?.message ?? err}`);
      throw err;
    }
  };

  return (
    <MainLayout
      title="Agenda"
      subtitle={format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
    >
      <div className="flex gap-6 h-full">
        <div className="flex-1 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <ProfessionalTabs
              professionals={professionals}
              selectedId={selectedProfessional}
              onSelect={setSelectedProfessional}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Search className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Printer className="w-4 h-4" />
              </Button>
              <Button onClick={() => setModalOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Agendamento
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <TimeSlotGrid
              appointments={appointmentsForUI}
              onSlotClick={handleSlotClick}
              onStatusChange={handleStatusChange}
            />
          )}

          {selectedAppointment && (
            <div className="bg-card rounded-lg border border-border p-4 animate-slide-in">
              <h3 className="font-semibold mb-2">Detalhes do Agendamento</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Paciente:</span>
                  <p className="font-medium">{selectedAppointment.cliente_nome}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Profissional:</span>
                  <p className="font-medium">{selectedAppointment.professionalName || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Convênio:</span>
                  <p className="font-medium">{selectedAppointment.healthInsurance || 'Particular'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Observações:</span>
                  <p className="font-medium">{selectedAppointment.observacao || '-'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-72 space-y-4 flex-shrink-0">
          <MiniCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
          <StatusLegend />
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-medium text-sm mb-3">Funções Rápidas</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start text-sm">
                Localizar dia e horário disponível
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm text-destructive hover:text-destructive">
                Apagar agendamentos
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AppointmentModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onSave={handleSaveAppointment}
      />
    </MainLayout>
  );
}
