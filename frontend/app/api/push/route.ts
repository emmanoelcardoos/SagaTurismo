import { NextResponse } from 'next/server';
import { requirePortalUser } from '@/lib/serverAuth';

export async function POST(request: Request) {
  // Apenas operadores autenticados do portal (antes era um relay aberto de push).
  const auth = await requirePortalUser(request);
  if (auth.error) return auth.error;

  try {
    const { mensagens } = await request.json();
    if (!Array.isArray(mensagens) || mensagens.length === 0 || mensagens.length > 10000) {
      return NextResponse.json({ error: 'Lista de mensagens inválida.' }, { status: 400 });
    }

    // A Expo recomenda enviar em lotes de 100 no máximo.
    const chunks = [];
    for (let i = 0; i < mensagens.length; i += 100) {
      chunks.push(mensagens.slice(i, i + 100));
    }

    // O servidor faz o disparo (aqui o navegador já não consegue bloquear!)
    for (const chunk of chunks) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro na API de push:", error);
    return NextResponse.json({ error: "Erro ao enviar notificação" }, { status: 500 });
  }
}