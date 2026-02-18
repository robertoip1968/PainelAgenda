import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Users, 
  UserCheck, 
  Clock, 
  BarChart3, 
  Shield, 
  Smartphone,
  ArrowRight,
  Check
} from 'lucide-react';
import clinicReception from '@/assets/clinic-reception.png';
import logo from '@/assets/logo.bmp';

const features = [
  {
    icon: Smartphone,
    title: 'Agendamento por WhatsApp',
    description: 'Marque seu horário direto pelo WhatsApp.',
  },
  {
    icon: Calendar,
    title: 'Agenda Inteligente',
    description: 'Visualize e gerencie agendamentos de forma eficiente com nossa grade de horários interativa.',
  },
  {
    icon: Users,
    title: 'Multi-Profissional',
    description: 'Suporte completo para múltiplos profissionais em uma única plataforma.',
  },
  {
    icon: Clock,
    title: 'Gestão de Tempo',
    description: 'Controle de status em tempo real: aguardando, confirmado, em atendimento e finalizado.',
  },
  {
    icon: BarChart3,
    title: 'Dashboard',
    description: 'Acompanhe métricas importantes como taxa de comparecimento e produtividade.',
  },
  {
    icon: Shield,
    title: 'Seguro e Confiável',
    description: 'Seus dados protegidos com as melhores práticas de segurança.',
  },
];

const plans = [
  { label: 'Clínicas' },
  { label: 'Consultórios' },
  { label: 'Laboratórios' },
];

export function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Painel Agenda" className="h-10 object-contain" />
            <span className="text-2xl font-bold text-primary">Painel Agenda</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button className="gap-2">
                Começar Agora
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6 min-h-[600px] flex items-center">
        {/* Background Image - sem overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${clinicReception})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        <div className="container mx-auto relative z-10 flex justify-end px-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-xl max-w-xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <UserCheck className="w-4 h-4" />
              Sistema completo de agendamentos
            </div>
            
            <h1 className="text-2xl md:text-4xl font-bold mb-6 leading-tight text-foreground">
              Gerencie os agendamentos da sua clínica com{' '}
              <span className="text-primary">tecnologia</span> e{' '}
              <span className="text-secondary">eficiência</span>
            </h1>
            
            <p className="text-xl text-foreground mb-8 max-w-2xl mx-auto">
              Plataforma completa para agendamento de consultas e exames. 
              Ideal para clínicas médicas, odontológicas, laboratórios e clínicas de imagem.
            </p>
            
            <p className="text-lg font-semibold text-foreground mb-4">Atendemos</p>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              {plans.map((plan) => (
                <Button 
                  key={plan.label} 
                  variant="secondary" 
                  size="lg"
                  className="text-base font-medium px-6 py-3 shadow-md hover:shadow-lg transition-all"
                >
                  {plan.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo o que você precisa em um só lugar
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Recursos poderosos para simplificar a gestão da sua clínica
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Por que escolher o Painel Agenda?
              </h2>
              <div className="space-y-4">
                {[
                  'Interface moderna e intuitiva',
                  'Suporte a múltiplos profissionais',
                  'Controle de status em tempo real',
                  'Relatórios e estatísticas detalhados',
                  'Cadastro completo de pacientes',
                  'Configurações flexíveis por profissional',
                ].map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-secondary" />
                    </div>
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <Link to="/auth" className="inline-block mt-8">
                <Button size="lg" className="gap-2">
                  Experimente Agora
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
            
            <div className="relative">
              <div className="aspect-video rounded-2xl gradient-primary p-8 flex items-center justify-center">
                <div className="bg-white/10 backdrop-blur rounded-xl p-6 w-full max-w-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                      D
                    </div>
                    <div className="text-white">
                      <p className="font-semibold">Dr. João Silva</p>
                      <p className="text-sm text-white/80">Cardiologia</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {['08:00 - Maria Santos', '08:30 - Pedro Costa', '09:00 - Ana Lima'].map((slot) => (
                      <div key={slot} className="bg-white/10 rounded-lg p-3 text-white text-sm">
                        {slot}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para transformar sua clínica?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            Comece agora mesmo e descubra como o Painel Agenda pode simplificar seu dia a dia.
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-10 gap-2">
              Criar Conta Gratuita
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Painel Agenda" className="h-8 object-contain" />
              <span className="text-xl font-bold text-primary">Painel Agenda</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 Painel Agenda. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
