/** One unmodified crop of the supplied logo. No separate body parts or redraw. */
export function CatMascot({className=''}:{className?:string}) {
 return <svg className={'brand-cat-art '+className} viewBox="0 0 470 644" fill="none" aria-hidden="true" focusable="false"><image href="/assets/viral-cat-logo.png" width="1200" height="644" /></svg>;
}
export function OriginalCatArt(){return <CatMascot className="original-cat-whole"/>}
