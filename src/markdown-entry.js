import {marked} from 'marked';
import DOMPurify from 'dompurify';
export function renderMarkdown(source){return DOMPurify.sanitize(marked.parse(source,{gfm:true,breaks:true}),{FORBID_TAGS:['img','style','input','iframe','form'],FORBID_ATTR:['style']});}
