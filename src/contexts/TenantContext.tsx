import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface Tenant {
  slug: string;
  schema_name: string;
  primary_domain: string;
}

interface TenantContextValue {
  tenant: Tenant | null;
  isLoading: boolean;
  error: string | null;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  isLoading: true,
  error: null,
});

/**
 * Extrai o slug do tenant a partir do hostname.
 * Ex: cir.painelagenda.com.br => "cir"
 * Em localhost, usa query param ?tenant=cir como fallback para dev.
 */
function extractSlugFromHostname(): string | null {
  const hostname = window.location.hostname;

  // Dev: localhost ou 127.0.0.1 — usa query param ?tenant=
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const params = new URLSearchParams(window.location.search);
    return params.get('tenant');
  }

  // Produção: primeiro label do hostname (ex: cir.painelagenda.com.br => "cir")
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }

  // Domínio raiz sem subdomínio — sem tenant
  return null;
}

interface TenantProviderProps {
  children: ReactNode;
  /** URL base da API. Default: '' (mesma origem) */
  apiBaseUrl?: string;
}

export function TenantProvider({ children, apiBaseUrl = '' }: TenantProviderProps) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const slug = extractSlugFromHostname();

    if (!slug) {
      // Sem subdomínio — pode ser a landing page ou domínio raiz
      setIsLoading(false);
      return;
    }

    const fetchTenant = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/tenant`, {
          headers: {
            'X-Tenant-Slug': slug,
          },
        });

        if (!response.ok) {
          throw new Error(`Tenant não encontrado (${response.status})`);
        }

        const data: Tenant = await response.json();
        setTenant(data);
      } catch (err) {
        console.error('Erro ao carregar tenant:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar tenant');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenant();
  }, [apiBaseUrl]);

  return (
    <TenantContext.Provider value={{ tenant, isLoading, error }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  }
  return context;
}
