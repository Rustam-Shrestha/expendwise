import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://ybc.example.com').replace(/\/$/, '');
const APP_NAME = 'YBC ERP';

export const routeMeta = {
  '/auth': { title: `Login | ${APP_NAME}`, description: 'Sign in to YBC ERP — secure business management for tasks, clients and invoices.' },
  '/login': { title: `Login | ${APP_NAME}`, description: 'Sign in to YBC ERP.' },
  '/': { title: `${APP_NAME} — Business Management`, description: 'Private ERP for task, client, invoice and employee management.' },
};

function upsertTag(selector, create) {
  let el = document.head.querySelector(selector);
  if (!el) { el = create(); document.head.appendChild(el); }
  return el;
}

export default function SEO({ title, description, canonical, noIndex }) {
  const location = useLocation();
  const cleanPath = location.pathname.split('?')[0];
  const url = `${SITE_URL}${cleanPath}`;
  const meta = routeMeta[cleanPath] || {};
  const finalTitle = title || meta.title || `${APP_NAME}`;
  const finalDesc = description || meta.description || 'Private ERP — authentication required.';
  const finalCanonical = canonical || url;

  useEffect(() => {
    document.title = finalTitle;
    const descTag = upsertTag('meta[name="description"]', () => { const m=document.createElement('meta'); m.name='description'; return m; });
    descTag.content = finalDesc;
    const canTag = upsertTag('link[rel="canonical"]', () => { const l=document.createElement('link'); l.rel='canonical'; return l; });
    canTag.href = finalCanonical;
    const robotsTag = upsertTag('meta[name="robots"]', () => { const m=document.createElement('meta'); m.name='robots'; return m; });
    // Public pages indexable, app shell noindex by nature of auth but explicit
    robotsTag.content = noIndex ? 'noindex, nofollow' : 'index, follow';
  }, [finalTitle, finalDesc, finalCanonical, noIndex]);

  return null;
}
