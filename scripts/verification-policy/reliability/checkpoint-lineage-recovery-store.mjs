import {lstat,readFile,realpath} from 'node:fs/promises';
import path from 'node:path';
import {transition} from '../../verification-reliability-persistence.mjs';
import {createCheckpointLineageRecovery} from './checkpoint-lineage-recovery.mjs';

export function checkpointLineageRecoveryOperation({root,update,now}) {
  return async(id,{receiptPath,expected}={})=>{
    if(typeof receiptPath!=='string'||!receiptPath) throw new Error('Checkpoint lineage requires a source receipt');
    const target=path.resolve(root,receiptPath);
    const receiptRoot=path.resolve(root,'tmp/verification-receipts')+path.sep;
    if(!target.startsWith(receiptRoot)) throw new Error('Checkpoint lineage receipt is outside its canonical root');
    const stat=await lstat(target);
    if(!stat.isFile()||stat.isSymbolicLink()||await realpath(target)!==target)
      throw new Error('Checkpoint lineage receipt must be a canonical regular file');
    const bytes=await readFile(target),receiptUtf8=bytes.toString('utf8');
    if(!Buffer.from(receiptUtf8,'utf8').equals(bytes)) throw new Error('Checkpoint lineage receipt has invalid UTF-8');
    return update(id,incident=>{
      const recordedAt=now();
      const proof=createCheckpointLineageRecovery(incident,{receiptUtf8,expected,recordedAt,
        sourceReceipt:path.relative(root,target)});
      return transition({...incident,checkpointLineageRecovery:proof},
        'checkpoint-lineage-recovered',recordedAt,{proofDigest:proof.digest});
    });
  };
}
