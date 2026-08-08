import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, cpfCnpj, phone, postalCode, address, addressNumber, province, birthDate } = body;

    if (!name || !email || !cpfCnpj) {
      return NextResponse.json({ error: "Dados incompletos para criar a conta." }, { status: 400 });
    }

    const asaasUrl = process.env.ASAAS_API_URL || 'https://api-sandbox.asaas.com/v3';
    const apiKey = process.env.ASAAS_API_KEY;

    if (!apiKey) {
       return NextResponse.json({ error: "Chave da API do Asaas não configurada." }, { status: 500 });
    }

    const response = await fetch(`${asaasUrl}/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': apiKey,
      },
      body: JSON.stringify({
        name: name,
        email: email,
        cpfCnpj: cpfCnpj,
        mobilePhone: phone,
        postalCode: postalCode,
        address: address,
        addressNumber: addressNumber,
        province: province,
        birthDate: birthDate,
        incomeValue: 5000.00, // Formato exigido: YYYY-MM-DD
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro retornado pelo Asaas:", data);
      return NextResponse.json(
        { error: "O Asaas recusou a criação da conta.", details: data }, 
        { status: response.status }
      );
    }

    return NextResponse.json({ 
      success: true, 
      asaas_wallet_id: data.walletId, 
      account_id: data.id 
    });

  } catch (error: any) {
    console.error("Erro interno da API:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}