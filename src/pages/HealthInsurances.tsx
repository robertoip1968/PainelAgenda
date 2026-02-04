import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Search } from 'lucide-react';
import { HealthInsurance } from '@/types';
import { healthInsurances as initialHealthInsurances } from '@/data/mockData';
import { Badge } from '@/components/ui/badge';

export function HealthInsurances() {
  const [healthInsurancesList, setHealthInsurancesList] = useState<HealthInsurance[]>(initialHealthInsurances);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState<HealthInsurance | null>(null);
  const [formData, setFormData] = useState({ name: '', active: true });

  const filteredInsurances = healthInsurancesList.filter((insurance) =>
    insurance.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (insurance?: HealthInsurance) => {
    if (insurance) {
      setEditingInsurance(insurance);
      setFormData({ name: insurance.name, active: insurance.active });
    } else {
      setEditingInsurance(null);
      setFormData({ name: '', active: true });
    }
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) return;

    if (editingInsurance) {
      setHealthInsurancesList((prev) =>
        prev.map((ins) =>
          ins.id === editingInsurance.id
            ? { ...ins, name: formData.name, active: formData.active }
            : ins
        )
      );
    } else {
      const newInsurance: HealthInsurance = {
        id: String(Date.now()),
        name: formData.name,
        active: formData.active,
      };
      setHealthInsurancesList((prev) => [...prev, newInsurance]);
    }

    setModalOpen(false);
    setFormData({ name: '', active: true });
    setEditingInsurance(null);
  };

  return (
    <MainLayout title="Convênios" subtitle="Gerenciamento de convênios">
      <div className="space-y-6">
        {/* Header actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar convênio..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Convênio
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lista de Convênios</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInsurances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Nenhum convênio encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInsurances.map((insurance) => (
                    <TableRow key={insurance.id}>
                      <TableCell className="font-medium">{insurance.name}</TableCell>
                      <TableCell>
                        <Badge variant={insurance.active ? 'default' : 'secondary'}>
                          {insurance.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenModal(insurance)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingInsurance ? 'Editar Convênio' : 'Novo Convênio'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Convênio</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Digite o nome do convênio"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">Convênio ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.name.trim()}>
              {editingInsurance ? 'Salvar' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
