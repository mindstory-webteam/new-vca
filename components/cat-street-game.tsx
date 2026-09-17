'use client';
import Link from 'next/link';
import {ArrowUpRight,Gamepad2} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {CatMascot} from '@/components/cat-mascot';
export function GameTeaser(){return <section className="street-teaser container"><div className="street-teaser-copy"><h2>A little puzzle.<br/>A very <em>curious Cat.</em></h2><p>Can you get every parcel to its spot? Help the Cat find a way through five little neighbourhood puzzles. Take your time, try a new route and enjoy a few small wins.</p><Button asChild className="button purple"><Link href="/play">Play with the Cat <ArrowUpRight/></Link></Button><small>Five puzzles · Undo and hints · Up to 1,000 points</small></div><Link href="/play" className="street-teaser-world" aria-label="Play Cat Street"><div className="quest-teaser-art"><strong>HELLO,<br/>NEIGHBOUR.</strong><CatMascot/><small>FIND YOUR WAY</small></div><span><Gamepad2 size={22}/> A FEW MINUTES. A LITTLE FUN. <ArrowUpRight size={22}/></span></Link></section>}
