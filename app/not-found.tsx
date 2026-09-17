import Link from 'next/link';
import {Button} from '@/components/ui/button';
export default function NotFound(){return <section className="container empty-state not-found"><span className="quiet-caption">A LITTLE OFF THE BEATEN PATH / 404</span><h1>This Cat took<br/>a different turn.</h1><p>Let’s get you back to the neighbourhood.</p><Button asChild className="button purple"><Link href="/">Back to Viral Cat</Link></Button></section>}
