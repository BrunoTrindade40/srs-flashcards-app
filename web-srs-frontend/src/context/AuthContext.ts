import type { Session, User } from "@supabase/supabase-js";
import { createContext } from "react";

export interface AuthContextData {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

// React 19 Strict: Inicializado com null, sem hacks de type assertion.
export const AuthContext = createContext<AuthContextData | null>(null);