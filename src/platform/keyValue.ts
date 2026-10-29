/** Node 26 expone un localStorage vacío que pisa al de jsdom. En el navegador no hace nada. */
export function ensureLocalStorage(): Storage {
  try {
    const current = globalThis.localStorage;
    if (current && typeof current.getItem === 'function') return current;
  } catch {
    /* el getter de Node avisa y no es un Storage */
  }
  const store = new Map<string, string>();
  const memory = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  } as Storage;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    enumerable: true,
    writable: true,
    value: memory,
  });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: memory,
    });
  }
  return memory;
}

export async function kvSetItem(key: string, value: string): Promise<void> {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota / private mode */
  }
}

export async function kvGetItem(key: string): Promise<string | null> {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function kvRemoveItem(key: string): Promise<void> {
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

export async function kvGetJSON<T>(key: string): Promise<T | null> {
  const raw = await kvGetItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function kvSetJSON(key: string, value: unknown): Promise<void> {
  try {
    await kvSetItem(key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}
