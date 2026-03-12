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
import { DashboardCategory, DashboardDetailItem } from '@/types';

interface ChartDetailTableProps {
  selectedCategory: DashboardCategory | null;
  data: DashboardDetailItem[];
  isLoading?: boolean;
}

const categoryLabels: Record<DashboardCategory, string> = {
  contatos: 'Contatos Recebidos',
  agendamentos: 'Agendamentos Realizados',
  confirmacoes: 'Confirmações',
  cancelamentos: 'Cancelamentos',
  reagendamentos: 'Reagendamentos',
  no_show: 'Faltas (No-show)',
};

export function ChartDetailTable({ selectedCategory, data, isLoading }: ChartDetailTableProps) {
  const title = selectedCategory
    ? categoryLabels[selectedCategory] || selectedCategory
    : 'Selecione uma categoria no gráfico';

  const firstColumnLabel = selectedCategory === 'contatos' ? 'Contato' : 'Paciente';
  const secondColumnLabel = selectedCategory === 'contatos' ? 'Telefone' : 'Profissional';

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
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Carregando registros...</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum registro encontrado para esta categoria
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{firstColumnLabel}</TableHead>
                  <TableHead>{secondColumnLabel}</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.info || '—'}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.time}</TableCell>
                    <TableCell>{item.type || '—'}</TableCell>
                    <TableCell>
                      {item.appointment_status ? (
                        <div className="space-y-1">
                          <StatusBadge status={item.appointment_status} />
                          {selectedCategory === 'confirmacoes' ? (
                            <div className="text-xs text-muted-foreground">{item.status_text}</div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-sm">{item.status_text || '—'}</span>
                      )}
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
