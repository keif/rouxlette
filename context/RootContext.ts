import { createContext, Dispatch } from "react";
import { AppState, initialAppState } from "./state";
import { AppActions } from "./actions";

export const RootContext = createContext<{
	state: AppState;
	dispatch: Dispatch<AppActions>;
}>({
	state: initialAppState,
	dispatch: () => undefined,
});
