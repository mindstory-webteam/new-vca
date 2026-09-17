import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import ts from 'typescript';
const require=createRequire(import.meta.url);
function load(path,imports={}){const output=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const m={exports:{}};new Function('require','module','exports',output)(name=>name in imports?imports[name]:require(name),m,m.exports);return m.exports}
const puzzle=load('lib/cat-puzzles.ts');
const solutions=['URDRU','UULLRDDLLUU','LUUURRDRRUULDD','RUUDLDLUULUURRDR','UURUURULLLDDDLDRUURRDRUU'];
for(let i=0;i<5;i++)assert.equal(puzzle.validatePuzzle(i,solutions[i]).score,200);
assert.equal(puzzle.validatePuzzle(0,'LRLR'+solutions[0]).score,150);
for(const [stage,moves] of [[0,''],[0,'UUUUUU'],[0,'R'],[0,solutions[0]+'L'],[0,'x'],[-1,'R'],[5,'R'],[0,'R'.repeat(401)]])assert.throws(()=>puzzle.validatePuzzle(stage,moves));
const start=puzzle.startPuzzle(0),snapshot=structuredClone(start);
assert.ok(puzzle.movePuzzle(0,start,'U'));assert.deepEqual(start,snapshot,'Moves leave undo snapshots untouched');
assert.equal(puzzle.movePuzzle(0,{cat:{x:1,y:1},crates:[{x:3,y:3}],moves:0},'L'),null);
assert.equal(puzzle.movePuzzle(0,{cat:{x:1,y:2},crates:[{x:2,y:2},{x:3,y:2}],moves:0},'R'),null);
assert.equal(puzzle.stuckCrate(0,{cat:{x:2,y:2},crates:[{x:1,y:1}],moves:0}),true);
assert.equal(await puzzle.puzzleHint(0,{cat:{x:2,y:2},crates:[{x:1,y:1}],moves:0}),null);
// Following one hint at a time must actually lead to completion, including after walking away.
const hintStart=performance.now();
for(let stage=0;stage<5;stage++){
 let state=puzzle.startPuzzle(stage),steps=0;
 if(stage===0)state=puzzle.movePuzzle(stage,state,'L');
 while(!puzzle.complete(stage,state)&&steps++<100){const direction=await puzzle.puzzleHint(stage,state);assert.ok(direction,`Hint exists for stage ${stage}, move ${steps}`);state=puzzle.movePuzzle(stage,state,direction);assert.ok(state,'Hint is a legal move')}
 assert.ok(puzzle.complete(stage,state),`Hints finish stage ${stage} without looping`);
 assert.ok(state.moves<=puzzle.puzzles[stage].par,`Hints support the move bonus on stage ${stage}`);
}
console.log(`Puzzle routes and hints passed (${Math.round(performance.now()-hintStart)}ms).`);
console.log('Passed: all five solvable boards, move validation, hints, snapshot immutability, completion bonuses and bounded move limits.');
