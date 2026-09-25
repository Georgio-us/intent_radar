import {NextResponse, type NextRequest} from 'next/server';
import {createHash,timingSafeEqual} from 'node:crypto';
const equal=(a:string,b:string)=>timingSafeEqual(createHash('sha256').update(a).digest(),createHash('sha256').update(b).digest());
export function proxy(req:NextRequest){
 if(req.nextUrl.pathname==='/api/health')return NextResponse.next();
 const password=process.env.RADAR_PASSWORD;
 if(!password){
  if(process.env.NODE_ENV==='production')return new NextResponse('Set RADAR_PASSWORD in Railway Variables.',{status:503});
  return NextResponse.next();
 }
 let credentials='';
 try{const h=req.headers.get('authorization')??'';if(h.startsWith('Basic '))credentials=Buffer.from(h.slice(6),'base64').toString('utf8');}catch{}
 if(!equal(credentials,'reset:'+password))return new NextResponse('Войдите в Intent Radar',{status:401,headers:{'WWW-Authenticate':'Basic realm="Intent Radar", charset="UTF-8"','Cache-Control':'no-store'}});
 return NextResponse.next();
}
export const config={matcher:'/:path*'};
