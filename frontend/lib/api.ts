// lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_URL;

export interface CadastroPayload {
  nome: string;
  cpf: string;
  email: string;
  data_nascimento: string; // Novo campo
  arquivo: File;           // Comprovativo de residência
  foto: File;              // Foto de rosto (Selfie)
}

export interface CadastroResponse {
  status: 'sucesso' | 'erro';
  mensagem: string;
  valido_ia: boolean;
  token_carteira?: string; // Novo campo devolvido pelo Backend
}

export async function cadastrarResidente(payload: CadastroPayload): Promise<CadastroResponse> {
  const form = new FormData();
  
  // Anexando todos os campos conforme o backend espera
  form.append('nome', payload.nome);
  form.append('cpf', payload.cpf);
  form.append('email', payload.email);
  form.append('data_nascimento', payload.data_nascimento);
  form.append('arquivo', payload.arquivo); // Multipart do comprovativo
  form.append('foto', payload.foto);       // Multipart da selfie

  const res = await fetch(`${BASE}/api/v1/residentes/cadastrar`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // Se o backend enviar um erro 429 (Cota do Gemini), ele cairá aqui
    throw new Error(err?.detail ?? 'Erro ao processar o cadastro.');
  }

  return res.json();
}