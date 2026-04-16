import qs from 'qs';
export function appendQuery(baseUrl: string, params: Record<string, string>): string {
  if (!Object.keys(params).length) {
    return baseUrl;
  }

  const query = qs.stringify(params);
  const querySeparator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${querySeparator}${query}`;
}