'use client';

import { createContext, useContext, useState } from 'react';

interface MemberContentTypeState {
  contentTypeFilter: string;
  setContentTypeFilter: (type: string) => void;
}

const MemberContentTypeContext = createContext<MemberContentTypeState>({
  contentTypeFilter: 'all',
  setContentTypeFilter: () => {},
});

export function MemberContentTypeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');

  return (
    <MemberContentTypeContext.Provider
      value={{ contentTypeFilter, setContentTypeFilter }}
    >
      {children}
    </MemberContentTypeContext.Provider>
  );
}

export function useMemberContentType() {
  return useContext(MemberContentTypeContext);
}
