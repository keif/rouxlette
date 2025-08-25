import { useEffect, useContext } from 'react';
import { RootContext } from '../context/RootContext';
import { hydrateFilters } from '../context/reducer';
import { Filters, initialFilters } from '../context/state';
import useStorage from './useStorage';

const FILTERS_STORAGE_KEY = 'filters';

export default function useFiltersPersistence() {
  const { dispatch, state } = useContext(RootContext);
  const [deleteItem, getAllItems, getItem, setItem] = useStorage();

  // Load filters from storage on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const storedFilters = await getItem(FILTERS_STORAGE_KEY);
        if (storedFilters) {
          // Merge with initial filters to handle missing fields from updates
          const hydratedFilters: Filters = {
            ...initialFilters,
            ...storedFilters,
          };
          dispatch(hydrateFilters(hydratedFilters));
        }
      } catch (error) {
        console.error('Failed to load filters from storage:', error);
      }
    };

    loadFilters();
  }, [dispatch, getItem]);

  // Save filters to storage when they change
  useEffect(() => {
    const saveFilters = async () => {
      try {
        await setItem(FILTERS_STORAGE_KEY, state.filters);
      } catch (error) {
        console.error('Failed to save filters to storage:', error);
      }
    };

    // Only save if filters have been hydrated (to avoid overwriting with initial state)
    if (state.filters !== initialFilters) {
      saveFilters();
    }
  }, [state.filters, setItem]);

  return {
    clearStoredFilters: () => deleteItem(FILTERS_STORAGE_KEY),
  };
}