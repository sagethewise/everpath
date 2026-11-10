import snapshot from './blizzard-pets.json';
export interface PetDetail {id:number;name:string;imageUrl:string|null;source:string|null;zone:string|null;description:string|null;verifiedDetail:boolean;provenance:string;companionEligibility:string}
interface PetSnapshot {status:string;pets:PetDetail[]}
export const detailedPets=(snapshot as PetSnapshot).pets;
