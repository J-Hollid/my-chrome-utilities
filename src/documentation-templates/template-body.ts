export const DOCUMENTATION_TEMPLATE_XLSX_TYPE="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export interface DocumentationTemplateBody {digest:string;byteLength:number;body:Blob|(()=>Promise<Blob>)}
export interface StoredDocumentationTemplateBody {digest:string;byteLength:number;body:Blob}
const hex=(bytes:Uint8Array)=>Array.from(bytes,byte=>byte.toString(16).padStart(2,"0")).join("");
export async function validateDocumentationTemplateBody(metadata:Pick<DocumentationTemplateBody,"digest"|"byteLength">,body:Blob):Promise<void>{if(body.type!==DOCUMENTATION_TEMPLATE_XLSX_TYPE||body.size!==metadata.byteLength||body.size>10*1024*1024)throw new DOMException("Choose a valid Excel template body.","DataError");const digest=`sha256:${hex(new Uint8Array(await crypto.subtle.digest("SHA-256",await body.arrayBuffer())))}`;if(digest!==metadata.digest)throw new DOMException("The Excel template body digest does not match its bytes.","DataError");}

