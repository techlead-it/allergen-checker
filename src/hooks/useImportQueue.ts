import { useState } from "react";
import { importQueue as initialQueue } from "../data/mock";
import type { ImportQueueItem } from "../data/types";

const STORAGE_KEY = "import-queue";

function loadFromStorage(): ImportQueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialQueue;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return initialQueue;
  } catch {
    return initialQueue;
  }
}

function saveToStorage(items: ImportQueueItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useImportQueue() {
  const [queue, setQueueState] = useState<ImportQueueItem[]>(loadFromStorage);

  function setQueue(updater: ImportQueueItem[] | ((prev: ImportQueueItem[]) => ImportQueueItem[])) {
    setQueueState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveToStorage(next);
      return next;
    });
  }

  return [queue, setQueue] as const;
}
