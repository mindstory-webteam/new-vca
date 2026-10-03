import Link from 'next/link';
import Image from 'next/image';
import {ArrowUpRight} from 'lucide-react';
import {clientWork} from '@/lib/client-work';

export function ClientShowcase(){
  return (
    <div className="client-grid">
      {clientWork.map((c,i)=>(
        <Link className="client-card" key={c.id} href={'/work/clients/'+c.id}>
          <div className="client-card-media">
            <Image src={c.image} alt={c.imageAlt} fill sizes="(max-width: 768px) 100vw, 50vw" priority={i<2}/>
          </div>
          <div className="client-card-body">
            <p className="client-meta">{c.businessType}</p>
            <h3>{c.name}</h3>
            <p className="client-tagline">{c.tagline}</p>
            <p className="client-focus">{c.focus}</p>
            <span className="portfolio-link-icon"><ArrowUpRight size={23}/></span>
          </div>
        </Link>
      ))}
    </div>
  );
}