import { api } from '@/lib/axios';

export interface FacebookPageOption {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  category: string;
}

export async function connectFacebook(shortLivedToken: string): Promise<FacebookPageOption[]> {
  const { data } = await api.post('/configuracion/facebook/connect', { shortLivedToken });
  return data.pages;
}

export async function saveFacebookPage(
  pageId: string,
  pageName: string,
  pageAccessToken: string,
): Promise<void> {
  await api.post('/configuracion/facebook/save-page', { pageId, pageName, pageAccessToken });
}

export async function disconnectFacebook(): Promise<void> {
  await api.delete('/configuracion/facebook/disconnect');
}
