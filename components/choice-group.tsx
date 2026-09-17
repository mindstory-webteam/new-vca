'use client';
import type {ReactNode} from 'react';
import {ToggleGroup,ToggleGroupItem} from '@/components/ui/toggle-group';
export function ChoiceGroup({value,onValueChange,children,className='',label='Choose an option'}:{value:string;onValueChange:(value:string)=>void;children:ReactNode;className?:string;label?:string}){return <ToggleGroup type="single" value={value} onValueChange={next=>{if(next)onValueChange(next)}} className={'choice-surface '+className} aria-label={label}>{children}</ToggleGroup>}
export function ChoiceList({children,className=''}:{children:ReactNode;className?:string}){return <div className={className} data-slot="choice-list">{children}</div>}
export function ChoiceItem({value,children}:{value:string;children:ReactNode}){return <ToggleGroupItem value={value}>{children}</ToggleGroupItem>}
