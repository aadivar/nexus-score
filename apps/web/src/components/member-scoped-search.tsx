'use client';

import { MemberSearch } from '@/components/member-search';
import { useMemberContentType } from '@/components/member-content-type-context';

export function MemberScopedSearch() {
  const { contentTypeFilter, era } = useMemberContentType();
  return (
    <MemberSearch
      placeholder="Search another publisher..."
      className="w-full sm:w-80"
      scope={{ contentType: contentTypeFilter, era }}
    />
  );
}
