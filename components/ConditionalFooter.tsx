'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Don't show footer on dashboard and auth pages
  const hideFooterPaths = [
    '/dashboard',
    '/auth/callback',
  ];
  
  const shouldHideFooter = hideFooterPaths.some(path => pathname?.startsWith(path));
  
  if (shouldHideFooter) {
    return null;
  }
  
  return <Footer />;
}
