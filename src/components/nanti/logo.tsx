import { Asterisk } from 'lucide-react';
export function Logo({showWord=true}:{showWord?:boolean}) { return <span className="n-logo"><Asterisk aria-hidden="true"/>{showWord&&<span>NANTI<span className="logo-dot">.</span></span>}</span>; }
