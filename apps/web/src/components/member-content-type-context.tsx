'use client';

import { createContext, useContext, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { BenchmarkEra, BenchmarkScope } from '@/lib/benchmark-scope';

interface MemberContentTypeState {
  contentTypeFilter: string;
  setContentTypeFilter: (type: string) => void;
  era: BenchmarkEra;
  setEra: (era: BenchmarkEra) => void;
}

const MemberContentTypeContext = createContext<MemberContentTypeState>({
  contentTypeFilter: 'all',
  setContentTypeFilter: () => {},
  era: 'overall',
  setEra: () => {},
});

export function MemberContentTypeProvider({
  children,
  initialScope,
}: {
  children: React.ReactNode;
  initialScope: BenchmarkScope;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [contentTypeFilter, setContentTypeState] = useState(initialScope.contentType);
  const [era, setEraState] = useState<BenchmarkEra>(initialScope.era);

  const replaceScope = (next: BenchmarkScope) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('contentType', next.contentType);
    params.set('era', next.era);
    const href = `${pathname}?${params.toString()}`;
    // Keep the address bar synchronous with the visible client-side scope.
    // The router call then reconciles the App Router state without scrolling.
    window.history.replaceState(window.history.state, '', href);
    router.replace(href, { scroll: false });
  };

  const setContentTypeFilter = (contentType: string) => {
    setContentTypeState(contentType);
    replaceScope({ contentType, era });
  };

  const setEra = (nextEra: BenchmarkEra) => {
    setEraState(nextEra);
    replaceScope({ contentType: contentTypeFilter, era: nextEra });
  };

  return (
    <MemberContentTypeContext.Provider
      value={{ contentTypeFilter, setContentTypeFilter, era, setEra }}
    >
      {children}
    </MemberContentTypeContext.Provider>
  );
}

export function useMemberContentType() {
  return useContext(MemberContentTypeContext);
}
