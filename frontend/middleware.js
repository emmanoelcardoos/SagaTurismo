import { NextResponse } from 'next/server';

export function middleware(request) {
  // Pega o cookie de acesso do navegador
  const isAuthenticated = request.cookies.get('projeto_autorizado');
  const { pathname } = request.nextUrl;

  // Permite acesso livre à página de login e arquivos de sistema
  if (pathname === '/login' || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Se não estiver autenticado, redireciona para a página de login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
