// lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_URL;

export interface CadastroResponse {
  status: 'sucesso' | 'erro';
  mensagem: string;
  valido_ia: boolean;
  token_carteira?: string;
}

// MUDANÇA MÁGICA: Agora a função recebe o FormData diretamente, 
// sem a interface antiga que limitava a 1 pessoa só.
export async function cadastrarResidente(formData: FormData): Promise<CadastroResponse> {
  
  const res = await fetch(`${BASE}/api/v1/residentes/cadastrar`, {
    method: 'POST',
    // ATENÇÃO: Nunca coloque headers de Content-Type aqui. O fetch faz isso sozinho.
    body: formData, 
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    
    // Isto vai imprimir o verdadeiro motivo do erro no console se algo falhar
    console.error("[FASTAPI 422 DETAIL]:", err);
    
    // Transforma o array chato do FastAPI numa string legível para o frontend não dar [object Object]
    const mensagemErro = err?.detail 
      ? (typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail))
      : 'Erro ao processar o cadastro.';
      
    throw new Error(mensagemErro);
  }

  return res.json();
}