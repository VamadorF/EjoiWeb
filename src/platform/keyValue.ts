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
