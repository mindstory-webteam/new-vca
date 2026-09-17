import {services,goals} from './content';
import {industryPages} from './industry-pages';
export function recommendServices(industry:string,goal:string){const chosen=goals.find(g=>g.id===goal)||goals[0];const specialist=industryPages[industry]?.mix||[];const lead=chosen.services[0];const ranked=[services[lead],...specialist.map(slug=>services.find(s=>s.slug===slug)!),...chosen.services.map(index=>services[index])];return ranked.filter((s,index,list)=>s&&list.findIndex(x=>x?.slug===s.slug)===index).slice(0,3)}
