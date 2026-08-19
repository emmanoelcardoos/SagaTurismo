import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { mensagens } = await request.json();

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