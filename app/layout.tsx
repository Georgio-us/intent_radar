import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Intent Radar · Reset', description:'Локальная лаборатория поиска клиентского спроса'};
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="ru"><body>{children}</body></html>; }
