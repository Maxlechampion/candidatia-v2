import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
});

export const config = {
  // Ce matcher ignore :
  // - Les dossiers système (_next, _vercel)
  // - Les routes API (api)
  // - TOUS les fichiers avec une extension (ex: favicon.ico, images.png, etc.) grâce à .*\\..*
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};