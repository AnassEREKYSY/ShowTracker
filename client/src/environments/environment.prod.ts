// Production: the client's Nginx proxies /api to the API container (same origin, no CORS).
export const environment = {
  production: true,
  apiBaseUrl: '/api',
  imageBase: 'https://image.tmdb.org/t/p',
};
