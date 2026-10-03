import {PageIntro,InlineCta} from '@/components/shared';
import {WorkGallery} from '@/components/work-gallery';

export const metadata={
  title:'Our Work — Digital Experiences',
  description:'Branding, social media and paid advertising work delivered by Viral Cat for Chaipeedika, Eqsoft, Mundukada and Benxora.',
  alternates:{canonical:'/work'}
};

export default function Page(){
  return <>
    <PageIntro eyebrow="" title="Built with creativity," accent="strategy & purpose." description="Take a look at the branding projects, digital solutions, and creative work we’ve delivered for businesses looking to stand out, engage their audience, and grow in the digital space."/>
    <section className="container content-area"><WorkGallery/></section>
    <InlineCta title="Like what you see? Let’s make it yours." text="Bring your real business details. We’ll find the story only you can tell."/>
  </>;
}