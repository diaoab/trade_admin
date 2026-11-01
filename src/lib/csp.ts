/**
 * Content Security Policy du build de production, injectée dans index.html.
 * `connect-src` doit suivre VITE_API_URL, qui n'est connu qu'au build.
 * (frame-ancestors, ignoré dans une balise meta, est envoyé en en-tête HTTP par Nginx,
 * cf. deploy/nginx-admin.conf.)
 */
export function politiqueSecurite(apiUrl?: string) {
  let origineApi = '';
  if (apiUrl && /^https?:\/\//i.test(apiUrl)) origineApi = ` ${new URL(apiUrl).origin}`;
  return [
    "default-src 'self'",
    "script-src 'self'",
    // Inline autorisé pour les styles seulement (largeur des barres, hauteurs de l'histogramme)
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    `connect-src 'self'${origineApi}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}
