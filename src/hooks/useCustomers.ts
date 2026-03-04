import { useState } from "react";
import { customers as initialCustomers } from "../data/mock";
import type { Customer } from "../data/mock";
import { migrateCustomer } from "../utils/migration";

const STORAGE_KEY = "customers";

function loadFromStorage(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialCustomers;
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : initialCustomers;
    return items.map(migrateCustomer);
  } catch {
    return initialCustomers;
  }
}

function saveToStorage(items: Customer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useCustomers() {
  const [customers, setCustomersState] = useState<Customer[]>(loadFromStorage);

  function setCustomers(updater: Customer[] | ((prev: Customer[]) => Customer[])) {
    setCustomersState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveToStorage(next);
      return next;
    });
  }

  return [customers, setCustomers] as const;
}
