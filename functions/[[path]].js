export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.pathname.startsWith('/api/')) {
    return context.next();
  }

  const response = await context.next();

  if (response.status !== 404) {
    return response;
  }

  if (url.pathname.includes('.')) {
    return response;
  }

  url.pathname = '/index.html';
  return context.env.ASSETS.fetch(new Request(url.toString(), context.request));
}
