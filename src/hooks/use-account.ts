"use client";

import type { AccountInfo } from "@/lib/types";
import { useLocalStorage } from "./use-local-storage";

export function useAccount() {
  const [account, setAccount, loaded] = useLocalStorage<AccountInfo>(
    "mp-account",
    { cashBalance: 0, marginLoan: 0 },
  );

  return { account, setAccount, loaded };
}
