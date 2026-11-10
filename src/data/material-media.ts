import raw from './material-media.json';
const snapshot=raw as {status:string;icons:Record<string,string|null>};
export function itemIcon(itemId:number):string|null {return snapshot.icons[String(itemId)]??null;}
