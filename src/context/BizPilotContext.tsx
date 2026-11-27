'use client';

import React, { createContext, useContext } from 'react';
import { SupportedLanguage } from '@/src/lib/i18n';
import { Business } from '@/src/types/bizpilot';

export interface BizPilotQuota {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  planName: string;
}

export interface BizPilotContextType {
  activeBusiness: Business | null;
  businesses: Business[];
  setActiveBusiness: (b: Business) => void;
  lang: SupportedLanguage;
  setLang: (l: SupportedLanguage) => void;
  refreshWorkspaces: () => Promise<void>;
  quota: BizPilotQuota;
}

export const BizPilotContext = createContext<BizPilotContextType>({
  activeBusiness: null,
  businesses: [],
  setActiveBusiness: () => {},
  lang: 'en',
  setLang: () => {},
  refreshWorkspaces: async () => {},
  quota: { used: 0, limit: 20, remaining: 20, percentage: 0, planName: 'Free' },
});

export const useBizPilot = () => useContext(BizPilotContext);
