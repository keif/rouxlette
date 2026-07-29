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

	// The radius we last issued a reconcile for. A reconcile that FAILS leaves
	// `lastSearch` stale (the screen's catch only clears results), so without
	// this guard the effect would re-fire the instant `isSearching` clears and
	// retry forever on a network/API error. We attempt each radius at most once;
	// the next attempt requires the applied radius to actually change again. A
	// successful reconcile updates `lastSearch` so `isStale` goes false anyway.
	const attemptedRadiusRef = useRef<number | null>(null);
	useEffect(() => {
		if (isSearching) return;              // wait for any in-flight search
		if (!isStale || !last) {
			// Caught up (or nothing committed): clear the failed-attempt guard so a
			// later divergence back to a previously-attempted radius retries fresh.
			attemptedRadiusRef.current = null;
			return;
		}
		if (attemptedRadiusRef.current === radius) return; // already tried this radius; wait for a change

		// Only the auto (opt-in, focused) path refetches from the effect. This
		// covers the mid-flight case for a focused browse screen too: the effect
		// is keyed on `isSearching`, so it re-runs when an in-flight search
		// settles and reconciles then. Non-auto callers (blurred Search, Home)
		// stay quiet and reconcile via `reconcile()` on an explicit action —
		// avoiding background refetches and surprise re-spins.
		if (autoWhenIdle) {
			attemptedRadiusRef.current = radius;
			runSearch(last.term);
		}
		// runSearch reads the current coords via closure. Keyed on radius,
		// isSearching, autoWhenIdle (so regaining focus reconciles a radius changed
		// while blurred), and `last` (so a committed search that lands from another
		// screen — e.g. Home completing after the user switched to Search — is
		// reconciled even when radius/focus/isSearching didn't change).
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [radius, isSearching, autoWhenIdle, last]);

	/**
	 * Imperative reconcile for screens that refetch on an explicit action (Home's
	 * Spin Again). Returns true if a refetch was issued.
	 */
	const reconcile = (): boolean => {
		if (isStale && last) {
			// Mark the attempt (keeps the auto path's loop guard consistent); not
			// gated by it — an explicit re-spin may always retry.
			attemptedRadiusRef.current = radius;
			runSearch(last.term);
			return true;
		}
		return false;
	};

	return { isStale, reconcile };
}
