'use client';

import { useAuth } from '@/hooks/useAuth';
import { useCompanyContext } from '@/hooks/useCompanyContext';
import { useEffect } from 'react';

export default function DynamicTitle() {
  const { user, isAuthenticated } = useAuth();
  const { company } = useCompanyContext();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      document.title = 'SparrowX';
      return;
    }

    let title = 'Dashboard';
    
    if (user.role === 'customer') {
      title = `${user.firstName} ${user.lastName}`;
    }
    
    if (company?.name) {
      title += ` - ${company.name}`;
    }

    document.title = title;
  }, [user, isAuthenticated, company]);

  return null;
}