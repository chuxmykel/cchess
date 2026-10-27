import { useEffect, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { searchUsers, UserSearchResult } from '../network/restClient';

export const USER_SEARCH_MIN_LENGTH = 2;
export const USER_SEARCH_DELAY_MS = 300;

export type UserSearch =
  | { status: 'idle' }
  | { status: 'searching' }
  | { status: 'done'; results: UserSearchResult[] }
  | { status: 'error' };

type Searched = { term: string; results: UserSearchResult[] | null };

/** Players matching what's typed, asked of the server once typing pauses. */
export function useUserSearch(query: string): UserSearch {
  const session = useAuthSession();
  const { authorized } = session;
  const term = query.trim();
  const isSearchable = session.isReady && term.length >= USER_SEARCH_MIN_LENGTH;
  const [searched, setSearched] = useState<Searched | null>(null);

  useEffect(() => {
    if (!isSearchable) {
      return;
    }
    let isCurrent = true;
    const timer = setTimeout(() => {
      authorized((accessToken) => searchUsers(term, accessToken))
        .catch(() => null)
        .then((results) => {
          if (isCurrent) {
            setSearched({ term, results });
          }
        });
    }, USER_SEARCH_DELAY_MS);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [term, authorized, isSearchable]);

  if (!isSearchable) {
    return { status: 'idle' };
  }
  if (searched?.term !== term) {
    return { status: 'searching' };
  }
  return searched.results
    ? { status: 'done', results: searched.results }
    : { status: 'error' };
}
