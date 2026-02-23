import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';
import type { PatientFormData } from '@/pages/PatientForm';

interface Props {
  formData: PatientFormData;
  updateForm: (field: string, value: string) => void;
}

const formatCPF = (value: string) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');

const formatPhone = (value: string) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');

export function PersonalDataSection({ formData, updateForm }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Dados Pessoais</CardTitle>
        </div>
        <CardDescription>Informações básicas do paciente</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="name">Nome completo *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => updateForm('name', e.target.value)}
            placeholder="Nome completo do paciente"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpf">CPF *</Label>
          <Input
            id="cpf"
            value={formData.cpf}
            onChange={(e) => updateForm('cpf', formatCPF(e.target.value))}
            placeholder="000.000.000-00"
            maxLength={14}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate">Data de Nascimento *</Label>
          <Input
            id="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(e) => updateForm('birthDate', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sex">Sexo *</Label>
          <Select value={formData.sex} onValueChange={(v) => updateForm('sex', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="F">Feminino</SelectItem>
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
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateForm('email', e.target.value)}
            placeholder="email@exemplo.com"
          />
        </div>
      </CardContent>
    </Card>
  );
}
