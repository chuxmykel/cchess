import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthSession } from '../context/AuthSessionContext';
import { searchUsers, UserSearchResult } from '../network/restClient';

export const USER_SEARCH_MIN_LENGTH = 2;
export const USER_SEARCH_DELAY_MS = 300;
/** As many as the server sends at once. */
export const USER_SEARCH_PAGE_SIZE = 20;

export type UserSearch =
  | { status: 'idle' }
  | { status: 'searching' }
  | {
      status: 'done';
      results: UserSearchResult[];
      /** Whether the server may have more matches than these. */
      hasMore: boolean;
      isLoadingMore: boolean;
      /** Fetches the next page, appending it to the results. */
      loadMore: () => void;
    }
  | { status: 'error' };

type Searched = {
  term: string;
  results: UserSearchResult[] | null;
  hasMore: boolean;
  isLoadingMore: boolean;
};

/** Players matching what's typed, asked of the server once typing pauses,
 * then a page at a time as more are wanted. */
export function useUserSearch(query: string): UserSearch {
  const session = useAuthSession();
  const { authorized } = session;
  const term = query.trim();
  const isSearchable = session.isReady && term.length >= USER_SEARCH_MIN_LENGTH;
  const [searched, setSearched] = useState<Searched | null>(null);
  // The latest searched, for loadMore to read without going stale.
  const searchedRef = useRef(searched);
  useEffect(() => {
    searchedRef.current = searched;
  }, [searched]);

  useEffect(() => {
    if (!isSearchable) {
      return;
    }
    let isCurrent = true;
    const timer = setTimeout(() => {
      authorized((accessToken) =>
        searchUsers(term, accessToken, {
          limit: USER_SEARCH_PAGE_SIZE,
          offset: 0,
        }),
      )
        .catch(() => null)
        .then((results) => {
          if (isCurrent) {
            setSearched({
              term,
              results,
              hasMore: results?.length === USER_SEARCH_PAGE_SIZE,
              isLoadingMore: false,
            });
          }
        });
    }, USER_SEARCH_DELAY_MS);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [term, authorized, isSearchable]);

  const loadMore = useCallback(() => {
    const current = searchedRef.current;
    if (!current?.results || !current.hasMore || current.isLoadingMore) {
      return;
    }
    const { term: pageTerm, results: shown } = current;
    const loading = { ...current, isLoadingMore: true };
    searchedRef.current = loading;
    setSearched(loading);
    authorized((accessToken) =>
      searchUsers(pageTerm, accessToken, {
        limit: USER_SEARCH_PAGE_SIZE,
        offset: shown.length,
      }),
    )
      .then((page) => {
        setSearched((latest) => {
          if (latest?.term !== pageTerm || !latest.results) return latest;
          const known = new Set(latest.results.map((user) => user.id));
          return {
            term: pageTerm,
            results: [
              ...latest.results,
              ...page.filter((user) => !known.has(user.id)),
            ],
            hasMore: page.length === USER_SEARCH_PAGE_SIZE,
            isLoadingMore: false,
          };
        });
      })
      .catch(() => {
        // Keep what's shown; scrolling to the end again retries.
        setSearched((latest) =>
          latest?.term === pageTerm
            ? { ...latest, isLoadingMore: false }
            : latest,
        );
      });
  }, [authorized]);

  if (!isSearchable) {
    return { status: 'idle' };
  }
  if (searched?.term !== term) {
    return { status: 'searching' };
  }
  return searched.results
    ? {
        status: 'done',
        results: searched.results,
        hasMore: searched.hasMore,
        isLoadingMore: searched.isLoadingMore,
        loadMore,
      }
    : { status: 'error' };
}
