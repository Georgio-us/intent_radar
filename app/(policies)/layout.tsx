export default function PolicyLayout({children}:{children:React.ReactNode}) {
 return <main style={{maxWidth:800,margin:'40px auto',padding:'24px',lineHeight:1.7,background:'#fff'}}>
  <p>RESET · Intent Radar</p>
  {children}
  <hr />
  <nav aria-label="Документы"><a href="/privacy">Политика конфиденциальности</a> · <a href="/data-deletion">Удаление данных</a></nav>
 </main>;
}
