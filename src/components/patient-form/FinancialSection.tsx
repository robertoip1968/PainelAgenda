import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard } from 'lucide-react';
import type { PatientFormData } from '@/pages/PatientForm';

interface Props {
  formData: PatientFormData;
  updateForm: (field: string, value: string) => void;
  hasFinancialResponsible: boolean;
  setHasFinancialResponsible: (v: boolean) => void;
}

const formatCPF = (value: string) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');

export function FinancialSection({ formData, updateForm, hasFinancialResponsible, setHasFinancialResponsible }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">Informações Financeiras</CardTitle>
        </div>
        <CardDescription>Convênio e responsável financeiro</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="healthInsurance">Convênio</Label>
            <Select value={formData.healthInsurance} onValueChange={(v) => updateForm('healthInsurance', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o convênio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="particular">Particular</SelectItem>
                <SelectItem value="unimed">Unimed</SelectItem>
                <SelectItem value="sulamerica">SulAmérica</SelectItem>
                <SelectItem value="bradesco">Bradesco Saúde</SelectItem>
                <SelectItem value="amil">Amil</SelectItem>
                <SelectItem value="hapvida">Hapvida</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="hasResponsible"
            checked={hasFinancialResponsible}
            onCheckedChange={(checked) => setHasFinancialResponsible(checked as boolean)}
          />
          <Label htmlFor="hasResponsible" className="cursor-pointer">
            Possui responsável financeiro
          </Label>
        </div>

        {hasFinancialResponsible && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border mt-4">
            <div className="space-y-2">
              <Label htmlFor="responsibleName">Nome do Responsável</Label>
              <Input
                id="responsibleName"
                value={formData.responsibleName}
                onChange={(e) => updateForm('responsibleName', e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsibleCpf">CPF do Responsável</Label>
              <Input
                id="responsibleCpf"
                value={formData.responsibleCpf}
                onChange={(e) => updateForm('responsibleCpf', formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
