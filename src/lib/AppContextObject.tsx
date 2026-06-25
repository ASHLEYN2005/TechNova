
import { createContext } from "react";
// Import the type you defined
import { AppContextValue } from "./AppContext"; 

export const AppCtx = createContext<AppContextValue | undefined>(undefined);