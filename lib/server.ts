import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

// Where submitted briefs are written. Override with BRIEF_DATA_DIR to point at
// a persistent volume, or replace the two functions below with a real database
// client if you deploy to a read-only/serverless filesystem.
export function briefDir(){return process.env.BRIEF_DATA_DIR||join(process.cwd(),'.data','briefs')}

export type BriefRecord={id:string;submissionId:string;reference:string;business:string;name:string;email:string;phone:string;location:string;industry:string;goal:string;services:string[];requirement:string;timing:string;links:string;assessment:string;createdAt:string};

export async function findBrief(submissionId:string):Promise<BriefRecord|null>{
 try{return JSON.parse(await readFile(join(briefDir(),submissionId+'.json'),'utf8')) as BriefRecord}
 catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return null;throw error}
}

// Writes with the exclusive flag so a retried submission never creates a second
// record: whoever loses the race simply reads back the stored brief.
export async function saveBrief(record:BriefRecord):Promise<BriefRecord>{
 const dir=briefDir();
 await mkdir(dir,{recursive:true});
 try{await writeFile(join(dir,record.submissionId+'.json'),JSON.stringify(record,null,2),{flag:'wx'});return record}
 catch(error){
  if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;
  const existing=await findBrief(record.submissionId);
  if(!existing)throw error;
  return existing;
 }
}

export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store'}})}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !!origin&&origin===new URL(request.url).origin}
export async function body(request:Request){if(Number(request.headers.get('content-length')||0)>65536)throw new Error('Request too large.');const raw=await request.text();if(raw.length>65536)throw new Error('Request too large.');return JSON.parse(raw)}
