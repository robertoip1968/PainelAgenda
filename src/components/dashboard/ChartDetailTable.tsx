import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/schedule/StatusBadge';
import { AppointmentStatus } from '@/types';

interface ChartDetailItem {
  id: string;
  patientName: string;
  professionalName: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  type: string;
}

interface ChartDetailTableProps {
  selectedCategory: string | null;
  data: ChartDetailItem[];
}

const categoryLabels: Record<string, string> = {
  'Contatos': 'Contatos Recebidos',
  'Agendamentos': 'Agendamentos Realizados',
  'Confirmações': 'Confirmações',
  'Cancelamentos': 'Cancelamentos',
  'Reagendamento': 'Reagendamentos',
  'No-show': 'Faltas (No-show)',
};

export function ChartDetailTable({ selectedCategory, data }: ChartDetailTableProps) {
  const title = selectedCategory 
    ? categoryLabels[selectedCategory] || selectedCategory 
    : 'Selecione uma categoria no gráfico';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedCategory ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Clique em uma fatia do gráfico para ver os detalhes
          </p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum registro encontrado para esta categoria
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.patientName}</TableCell>
                    <TableCell>{item.professionalName}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.time}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
