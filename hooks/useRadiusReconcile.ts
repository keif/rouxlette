import { useContext, useEffect, useRef } from 'react';
import { RootContext } from '../context/RootContext';

interface UseRadiusReconcileOptions {
	/** Whether a search is currently in flight (drives mid-flight reconciliation). */
	isSearching: boolean;
	/** Refetch using the committed search term (the screen's search executor). */
	runSearch: (term: string) => void;
	/**
	 * When true, refetch as soon as the applied radius diverges from the
	 * displayed results' radius while idle (SearchScreen / browse). When false,
	 * only reconcile after an in-flight search settles or when the caller invokes
	 * `reconcile()` explicitly (HomeScreen / spin — avoids a surprise auto-spin
	 * on a mere filter nudge).
	 */
	autoWhenIdle: boolean;
}

/**
 * Single source of truth for "the displayed results were fetched with a radius
 * that no longer matches the applied filter" (#58). Reads the committed search
 * identity from shared state (`state.lastSearch`), so it works across screens —
 * including when results were populated elsewhere (e.g. Home's "View all"). It
 * always replays the *committed* term, never a screen's draft input.
 */
export function useRadiusReconcile({ isSearching, runSearch, autoWhenIdle }: UseRadiusReconcileOptions) {
	const { state } = useContext(RootContext);
	const last = state.lastSearch;
	const radius = state.filters.radiusMeters;
	const isStale = !!last && last.radiusMeters !== radius;

	const wasSearchingRef = useRef(isSearching);
	useEffect(() => {
		const justFinished = wasSearchingRef.current && !isSearching;
		wasSearchingRef.current = isSearching;

		if (isSearching) return;              // wait for any in-flight search
		if (!isStale || !last) return;        // results already match the applied radius

		// Refetch when browsing (auto) or when a search just settled with a now-stale
		// radius (mid-flight change) — the latter fires on both screens because a
		// search was already in progress, so a correcting refetch isn't a surprise.
		if (autoWhenIdle || justFinished) {
			runSearch(last.term);
		}
		// runSearch reads the current coords via closure; keyed on radius + isSearching.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [radius, isSearching]);

	/**
	 * Imperative reconcile for screens that refetch on an explicit action (Home's
	 * Spin Again). Returns true if a refetch was issued.
	 */
	const reconcile = (): boolean => {
		if (isStale && last) {
			runSearch(last.term);
			return true;
		}
		return false;
	};

	return { isStale, reconcile };
}
