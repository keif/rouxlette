/**
 * DEPRECATED: This hook is being replaced with usePersistentStorage
 * 
 * This legacy hook is kept for backward compatibility but will be removed.
 * The old implementation caused AsyncStorage callback flooding.
 * 
 * Migration guide:
 * OLD: const [deleteItem, getAllItems, getItem, setItem] = useStorage();
 * NEW: const storage = usePersistentStorage(); // then use storage.getItem(), etc.
 */

import usePersistentStorage from './usePersistentStorage';
import { logSafe } from '../utils/log';

logSafe('[useStorage] This hook is deprecated and causes AsyncStorage callback flooding. Please migrate to usePersistentStorage.');

export default function useStorage() {
	const storage = usePersistentStorage({
		keyPrefix: '@roux', // Maintain compatibility with existing keys
		debug: __DEV__,
		debounceMs: 300
	});

	// Legacy array-based return format for backward compatibility
	const deleteItem = (key: string) => storage.deleteItem(key);
	const getAllItems = () => storage.getAllItems();
	const getItem = (key: string) => storage.getItem(key);
	const setItem = (key: string, value: any) => storage.setItem(key, value);

	return [deleteItem, getAllItems, getItem, setItem] as const;
}
