import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import type { PatientFormData } from '@/pages/PatientForm';

interface Props {
  formData: PatientFormData;
  updateForm: (field: string, value: string) => void;
}

const formatZipCode = (value: string) =>
  value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');

const UF_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export function AddressSection({ formData, updateForm }: Props) {
  return (
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
              {UF_LIST.map((uf) => (
                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
