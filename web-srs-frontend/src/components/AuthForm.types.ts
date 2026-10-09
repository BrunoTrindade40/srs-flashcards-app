import type { SyntheticEvent } from "react";
import type { AuthMode } from "../domain/auth";

export interface AuthFormProps {
  mode: AuthMode;
  email: string;
  password: string;
  loading: boolean;
  errorMsg: string | null;
  successMsg: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: SyntheticEvent<HTMLFormElement>) => void;
  onSwitchMode: (mode: AuthMode) => void;
}
