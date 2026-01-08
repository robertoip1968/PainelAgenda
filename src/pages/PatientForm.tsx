import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, User, MapPin, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PatientForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hasFinancialResponsible, setHasFinancialResponsible] = useState(false);
  
  const [formData, setFormData] = useState({
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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Paciente cadastrado!",
        description: "O paciente foi cadastrado com sucesso.",
      });
      navigate('/pacientes');
    }, 1000);
  };

  const updateForm = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const formatZipCode = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  };

  return (
    <MainLayout title="Novo Paciente" subtitle="Preencha os dados do paciente">
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

        {/* Dados Pessoais */}
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

        {/* Endereço */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">Endereço</CardTitle>
            </div>
            <CardDescription>Endereço residencial do paciente</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP</Label>
              <Input
                id="zipCode"
                value={formData.zipCode}
                onChange={(e) => updateForm('zipCode', formatZipCode(e.target.value))}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
            
            <div className="lg:col-span-2 space-y-2">
              <Label htmlFor="street">Logradouro</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => updateForm('street', e.target.value)}
                placeholder="Rua, Avenida..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => updateForm('number', e.target.value)}
                placeholder="000"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={formData.complement}
                onChange={(e) => updateForm('complement', e.target.value)}
                placeholder="Apto, Bloco..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => updateForm('neighborhood', e.target.value)}
                placeholder="Bairro"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => updateForm('city', e.target.value)}
                placeholder="Cidade"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Select value={formData.state} onValueChange={(v) => updateForm('state', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map((uf) => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Convênio e Responsável Financeiro */}
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
            {isLoading ? 'Salvando...' : 'Salvar Paciente'}
          </Button>
        </div>
      </form>
    </MainLayout>
  );
}
