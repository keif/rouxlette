import AsyncStorage from "@react-native-async-storage/async-storage";

const handleError = (err: string) => {
	console.error(`LocalStorage Error: `, err);
};

export default () => {
	const deleteItem = async (key: string) => {
		return AsyncStorage.removeItem(`@roux:${key}`);
	};

	const getAllItems = async (): Promise<any> => AsyncStorage.getAllKeys()
			.then((keys: readonly string[]) => {
				const fetchKeys = keys.filter((k) => k.startsWith("@roux:"));
				return AsyncStorage.multiGet(fetchKeys);
			})
			.then((result) => result.map((r) => {
				if (r && r[1]) {
					return JSON.parse(r[1]);
				}
			}))
			.catch(handleError);

	const getItem = async (key: string): Promise<any> => {
		if (key !== ``) {
			return AsyncStorage
				.getItem(`@roux:${key}`)
				.then((json: any) => JSON.parse(json))
				.catch(handleError);
		}
	};

	const setItem = async (key: string, value: string): Promise<void> => {
		await AsyncStorage
			.setItem(`@roux:${key}`, JSON.stringify(value))
			.catch(handleError);
	};

	return [deleteItem, getAllItems, getItem, setItem] as const;
};
