import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

function gitFile(revision,file) {
  return execFileSync('git',['show',`${revision}:${file}`],{encoding:'utf8'});
}

export function insertionAuthorizedByCommit(commit,file) {
  const before=gitFile(`${commit}^`,file),after=gitFile(commit,file);
  let prefix=0;
  while(prefix<before.length&&before[prefix]===after[prefix])prefix++;
  let suffix=0;
  while(suffix<before.length-prefix&&before.at(-1-suffix)===after.at(-1-suffix))suffix++;
  const bytes=after.slice(prefix,after.length-suffix);
  assert.ok(bytes&&before===after.slice(0,prefix)+after.slice(after.length-suffix),
    `${commit} must authorize one insertion in ${file}`);
  const priorLineStart=before.lastIndexOf('\n',Math.max(0,prefix-2))+1;
  const nextLineEnd=before.indexOf('\n',prefix);
  return {before:before.slice(priorLineStart,prefix),bytes,
    after:before.slice(prefix,nextLineEnd<0?before.length:nextLineEnd+1)};
}

export function projectAuthorizedInsertions(current,additions,expected) {
  let projected=current;
  for(const addition of [...additions].reverse()){
    const exact=addition.before+addition.bytes+addition.after;
    const at=projected.indexOf(exact);
    assert.ok(at>=0&&projected.indexOf(exact,at+1)<0,'Expected one exact authorized insertion');
    projected=projected.slice(0,at)+addition.before+addition.after+
      projected.slice(at+exact.length);
  }
  assert.equal(projected,expected,'Only exact authorized insertions can differ');
  return projected;
}

export function assertHostConservationProjection() {
  const original='before\nafter\n';
  const additions=[{before:'before\n',bytes:'first\n',after:'after\n'},
    {before:'first\n',bytes:'second\n',after:'after\n'}];
  const current='before\nfirst\nsecond\nafter\n';
  assert.equal(projectAuthorizedInsertions(current,additions,original),original);
  for(const invalid of [
    'before\nsecond\nafter\n',
    'before\nfirst changed\nsecond\nafter\n',
    'first\nbefore\nsecond\nafter\n',
    'before\nfirst\nfirst\nsecond\nafter\n',
    'before\nfirst\nsecond\nextra\nafter\n'])
    assert.throws(()=>projectAuthorizedInsertions(invalid,additions,original),
      /authorized insertion|Only exact authorized insertions/u);
}
