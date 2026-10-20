import * as session from './session';
import { kvGetItem, kvRemoveItem, kvSetItem } from './keyValue';

const COMPANION_KEY = 'companion_data';
const COMPANION_USER_ID_KEY = 'companion_user_id';
const HOME_LAST_TAB_KEY = 'home_last_tab';
const SUBSCRIPTION_KEY = 'subscription_data';

export async function getAuthToken(): Promise<string | null> {
  return session.getAccessToken();
}

export async function setAuthToken(token: string): Promise<void> {
  session.setSession(token);
}

export async function removeAuthToken(): Promise<void> {
  session.clearSession();
}

export async function getRefreshToken(): Promise<string | null> {
  return null;
}

export async function setRefreshToken(): Promise<void> {
  /* refresh en cookie HttpOnly */
}

export async function removeRefreshToken(): Promise<void> {
  /* noop */
}

export async function setUserData(user: string): Promise<void> {
  session.setUserDataJson(user);
}

export async function getUserData(): Promise<string | null> {
  return session.getUserDataJson();
}

export async function clearAuthData(): Promise<void> {
  session.clearSession();
}

export async function setCompanionData(companion: string, userId?: string): Promise<void> {
  await kvSetItem(COMPANION_KEY, companion);
  if (userId) await kvSetItem(COMPANION_USER_ID_KEY, userId);
  else await kvRemoveItem(COMPANION_USER_ID_KEY);
}

export async function getCompanionUserId(): Promise<string | null> {
  return kvGetItem(COMPANION_USER_ID_KEY);
}

export async function getCompanionData(): Promise<string | null> {
  return kvGetItem(COMPANION_KEY);
}

export async function removeCompanionData(): Promise<void> {
  await kvRemoveItem(COMPANION_KEY);
  await kvRemoveItem(COMPANION_USER_ID_KEY);
}

export async function clearAllStorage(): Promise<void> {
  session.clearSession();
  await kvRemoveItem(COMPANION_KEY);
  await kvRemoveItem(COMPANION_USER_ID_KEY);
  await kvRemoveItem(HOME_LAST_TAB_KEY);
  await kvRemoveItem(SUBSCRIPTION_KEY);
}

export async function setSubscriptionData(json: string): Promise<void> {
  await kvSetItem(SUBSCRIPTION_KEY, json);
}

export async function getSubscriptionData(): Promise<string | null> {
  return kvGetItem(SUBSCRIPTION_KEY);
}

export async function removeSubscriptionData(): Promise<void> {
  await kvRemoveItem(SUBSCRIPTION_KEY);
}

export async function setLastHomeTab(tab: string): Promise<void> {
  await kvSetItem(HOME_LAST_TAB_KEY, tab);
}

export async function getLastHomeTab(): Promise<string | null> {
  return kvGetItem(HOME_LAST_TAB_KEY);
}

export async function clearAuthStorage(): Promise<void> {
  session.clearSession();
}
