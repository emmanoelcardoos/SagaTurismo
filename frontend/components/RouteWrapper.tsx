'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

export default function RouteWrapper({
  header,
  children,
  footer,
}: {
  header: ReactNode;
  children: ReactNode;
  footer: ReactNode;
}) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
      {!isHomePage && header}
      <main className="flex-1">{children}</main>
      {!isHomePage && footer}
    </div>
  );
}