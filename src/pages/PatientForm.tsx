import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PersonalDataSection } from '@/components/patient-form/PersonalDataSection';
import { AddressSection } from '@/components/patient-form/AddressSection';
import { FinancialSection } from '@/components/patient-form/FinancialSection';
import { usePatient, useSavePatient } from '@/hooks/useApiData';

export interface PatientFormData {
  name: string;
  birthDate: string;
  sex: string;
  cpf: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  healthInsurance: string;
  responsibleName: string;
  responsibleCpf: string;
}

const emptyForm: PatientFormData = {
  name: '',
  birthDate: '',
  sex: '',
  cpf: '',
  phone: '',
  email: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  zipCode: '',
  healthInsurance: 'particular',
  responsibleName: '',
  responsibleCpf: '',
};

function parseInsurancePlanId(value: string): number | null {
  if (!value || value === 'particular') return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}


function normalizeDateForInput(value?: string | null): string {
  if (!value) return '';

  const dateOnly = String(value).slice(0, 10);

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return dateOnly;
  }

  return '';
}

export function PatientForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [hasFinancialResponsible, setHasFinancialResponsible] = useState(false);
  const [formData, setFormData] = useState<PatientFormData>(emptyForm);

  const isEditing = Boolean(id);
  const patientId = id ? Number(id) : 0;

  const { data: patient, isLoading: isLoadingPatient, error: patientError } = usePatient(patientId);
  const savePatient = useSavePatient();

  useEffect(() => {
    if (!isEditing) {
      setFormData(emptyForm);
      setHasFinancialResponsible(false);
      return;
    }

    if (patient) {
      setFormData({
        name: patient.full_name || '',
        birthDate: normalizeDateForInput(patient.birth_date),
        sex: patient.sex || '',
        cpf: patient.cpf || '',
        phone: patient.phone || '',
        email: patient.email || '',
        street: patient.street || '',
        number: patient.number || '',
        complement: patient.complement || '',
        neighborhood: patient.neighborhood || '',
        city: patient.city || '',
        state: patient.state_uf || '',
        zipCode: patient.zip_code || '',
        healthInsurance: patient.insurance_plan_id ? String(patient.insurance_plan_id) : 'particular',
        responsibleName: '',
        responsibleCpf: '',
      });
      setHasFinancialResponsible(false);
    }
  }, [isEditing, patient]);

  useEffect(() => {
    if (isEditing && !isLoadingPatient && patientError) {
      toast({
        title: 'Paciente não encontrado',
        description: 'Não foi possível carregar os dados do paciente.',
        variant: 'destructive',
      });
      navigate('/pacientes');
    }
  }, [isEditing, isLoadingPatient, patientError, navigate, toast]);

  const updateForm = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const email = formData.email.trim();

    if (!email) {
      toast({
        title: 'E-mail obrigatório',
        description: 'Preencha o e-mail do paciente antes de salvar.',
        variant: 'destructive',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      toast({
        title: 'E-mail inválido',
        description: 'Informe um endereço de e-mail válido.',
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      ...(isEditing && patientId ? { id: patientId } : {}),
      full_name: formData.name.trim(),
      birth_date: formData.birthDate || null,
      sex: formData.sex || null,
      cpf: formData.cpf.trim(),
      phone: formData.phone.trim(),
      email,
      zip_code: formData.zipCode.trim() || null,
      street: formData.street.trim() || null,
      number: formData.number.trim() || null,
      complement: formData.complement.trim() || null,
      neighborhood: formData.neighborhood.trim() || null,
      city: formData.city.trim() || null,
      state_uf: formData.state || null,
      insurance_plan_id: parseInsurancePlanId(formData.healthInsurance),
    };

    setIsLoading(true);

    savePatient.mutate(payload, {
      onSuccess: () => {
        setIsLoading(false);
        toast({
          title: isEditing ? 'Paciente atualizado!' : 'Paciente cadastrado!',
          description: isEditing
            ? 'Os dados do paciente foram atualizados com sucesso.'
            : 'O paciente foi cadastrado com sucesso.',
        });
        navigate('/pacientes');
      },
      onError: (err: any) => {
        setIsLoading(false);
        toast({
          title: 'Erro ao salvar paciente',
          description: err?.message || 'Não foi possível salvar o paciente.',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <MainLayout
      title={isEditing ? 'Editar Paciente' : 'Novo Paciente'}
      subtitle={isEditing ? 'Atualize os dados do paciente' : 'Preencha os dados do paciente'}
    >
      <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/pacientes')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>

        <PersonalDataSection formData={formData} updateForm={updateForm} />
        <AddressSection formData={formData} updateForm={updateForm} />
        <FinancialSection
          formData={formData}
          updateForm={updateForm}
          hasFinancialResponsible={hasFinancialResponsible}
          setHasFinancialResponsible={setHasFinancialResponsible}
        />

        <div className="flex justify-end gap-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/pacientes')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="gap-2">
            <Save className="w-4 h-4" />
            {isLoading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Salvar Paciente'}
          </Button>
        </div>
      </form>
    </MainLayout>
  );
}
