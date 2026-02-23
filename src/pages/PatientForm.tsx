import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, User, MapPin, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { patients } from '@/data/mockData';
import { PersonalDataSection } from '@/components/patient-form/PersonalDataSection';
import { AddressSection } from '@/components/patient-form/AddressSection';
import { FinancialSection } from '@/components/patient-form/FinancialSection';

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
  healthInsurance: '',
  responsibleName: '',
  responsibleCpf: '',
};

export function PatientForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hasFinancialResponsible, setHasFinancialResponsible] = useState(false);
  const [formData, setFormData] = useState<PatientFormData>(emptyForm);

  const isEditing = Boolean(id);

  // Load patient data when editing
  useEffect(() => {
    if (id) {
      const patient = patients.find((p) => String(p.id) === id);
      if (patient) {
        setFormData({
          name: patient.full_name,
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
          healthInsurance: patient.insurance_plan_id ? String(patient.insurance_plan_id) : '',
          responsibleName: '',
          responsibleCpf: '',
        });
      } else {
        toast({ title: 'Paciente não encontrado', variant: 'destructive' });
        navigate('/pacientes');
      }
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: isEditing ? 'Paciente atualizado!' : 'Paciente cadastrado!',
        description: isEditing
          ? 'Os dados do paciente foram atualizados com sucesso.'
          : 'O paciente foi cadastrado com sucesso.',
      });
      navigate('/pacientes');
    }, 1000);
  };

  const updateForm = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

        {/* Actions */}
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
