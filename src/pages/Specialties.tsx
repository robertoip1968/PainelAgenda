import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Stethoscope, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Specialty } from '@/types';
import { useSpecialties, useSaveSpecialty } from '@/hooks/useApiData';

export function Specialties() {
  const { toast } = useToast();
  const { data: specialties = [], isLoading, error } = useSpecialties();
  const saveSpecialty = useSaveSpecialty();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);
  const [formData, setFormData] = useState({ name: '', is_active: true });

  const handleOpenDialog = (specialty?: Specialty) => {
    if (specialty) {
      setEditingSpecialty(specialty);
      setFormData({ name: specialty.name, is_active: specialty.is_active });
    } else {
      setEditingSpecialty(null);
      setFormData({ name: '', is_active: true });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({ title: "Erro", description: "O nome da especialidade é obrigatório.", variant: "destructive" });
      return;
    }

    saveSpecialty.mutate(
      { id: editingSpecialty?.id, name: formData.name, is_active: formData.is_active },
      {
        onSuccess: () => {
          toast({
            title: editingSpecialty ? "Especialidade atualizada!" : "Especialidade cadastrada!",
            description: editingSpecialty ? "Os dados foram atualizados com sucesso." : "A especialidade foi adicionada com sucesso.",
          });
          setIsDialogOpen(false);
          setEditingSpecialty(null);
          setFormData({ name: '', is_active: true });
        },
        onError: (err) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
      }
    );
  };

  if (isLoading) {
    return (
      <MainLayout title="Especialidades" subtitle="Carregando...">
        <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Especialidades" subtitle="Gerencie as especialidades dos profissionais">
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Stethoscope className="w-5 h-5" />
            <span>{specialties.length} especialidades cadastradas</span>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Especialidade
          </Button>
        </div>

        <div className="bg-card rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="w-32">Status</TableHead>
                <TableHead className="w-24 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {specialties.map((specialty) => (
                <TableRow key={specialty.id}>
                  <TableCell className="font-mono text-muted-foreground">#{specialty.id}</TableCell>
                  <TableCell className="font-medium">{specialty.name}</TableCell>
                  <TableCell>
                    <Badge variant={specialty.is_active ? "default" : "secondary"}>
                      {specialty.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(specialty)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSpecialty ? 'Editar Especialidade' : 'Nova Especialidade'}</DialogTitle>
              <DialogDescription>
                {editingSpecialty ? 'Atualize os dados da especialidade.' : 'Preencha os dados para cadastrar uma nova especialidade.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Especialidade *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Cardiologia" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Especialidade Ativa</Label>
                <Switch id="active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saveSpecialty.isPending}>
                {saveSpecialty.isPending ? 'Salvando...' : editingSpecialty ? 'Salvar Alterações' : 'Cadastrar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
