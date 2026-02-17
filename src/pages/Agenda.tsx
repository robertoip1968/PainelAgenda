import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { MiniCalendar } from '@/components/schedule/MiniCalendar';
import { StatusLegend } from '@/components/schedule/StatusLegend';
import { TimeSlotGrid } from '@/components/schedule/TimeSlotGrid';
import { ProfessionalTabs } from '@/components/schedule/ProfessionalTabs';
import { AppointmentModal } from '@/components/schedule/AppointmentModal';
import { Button } from '@/components/ui/button';
import { appointments as initialAppointments, professionals } from '@/data/mockData';
import { Appointment, AppointmentStatus } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Search, Printer } from 'lucide-react';
import { toast } from 'sonner';

export function Agenda() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>(initialAppointments);

  const filteredAppointments = appointmentsList.filter((apt) => {
    const dateMatch = apt.date === format(selectedDate, 'yyyy-MM-dd');
    const profMatch = selectedProfessional ? apt.professional_id === selectedProfessional : true;
    return dateMatch && profMatch;
  });

  const handleSlotClick = (time: string, appointment?: Appointment) => {
    setSelectedTime(time);
    setSelectedAppointment(appointment || null);
    if (!appointment) {
      setModalOpen(true);
    }
  };

  const handleStatusChange = (appointmentId: string, newStatus: AppointmentStatus) => {
    setAppointmentsList(prev => 
      prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      )
    );
    // Update selected appointment if it's the one being changed
    setSelectedAppointment(prev => 
      prev?.id === appointmentId ? { ...prev, status: newStatus } : prev
    );
  };

  const handleSaveAppointment = (data: any) => {
    toast.success('Agendamento realizado com sucesso!');
    console.log('Appointment data:', data);
  };

  return (
    <MainLayout 
      title="Agenda" 
      subtitle={format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
    >
      <div className="flex gap-6 h-full">
        {/* Main content */}
        <div className="flex-1 space-y-4 animate-fade-in">
          {/* Toolbar */}
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

          {/* Time slots */}
          <TimeSlotGrid
            appointments={filteredAppointments}
            onSlotClick={handleSlotClick}
            onStatusChange={handleStatusChange}
          />

          {/* Selected appointment details */}
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
                  <p className="font-medium">{selectedAppointment.professionalName}</p>
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

        {/* Sidebar */}
        <div className="w-72 space-y-4 flex-shrink-0">
          <MiniCalendar
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
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
