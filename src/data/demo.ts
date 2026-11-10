import type {Profession,Recipe,Pet} from './types';
/* Demonstration fixtures only. Do not present as verified WoW Forever game data. */
export const professions: Profession[] = [
  {id:'alchemy',name:'Alchemy',icon:'⚗️',tone:'lilac',desc:'Potions, elixirs & useful concoctions',max:300},
  {id:'blacksmithing',name:'Blacksmithing',icon:'⚒️',tone:'peach',desc:'Weapons, armor & metalwork',max:300},
  {id:'cooking',name:'Cooking',icon:'🍲',tone:'mint',desc:'Meals, recipes & campfire comforts',max:300},
  {id:'enchanting',name:'Enchanting',icon:'✨',tone:'blue',desc:'Magical enhancements & materials',max:300},
  {id:'engineering',name:'Engineering',icon:'⚙️',tone:'gold',desc:'Gadgets, devices & clever inventions',max:300},
  {id:'tailoring',name:'Tailoring',icon:'🧵',tone:'pink',desc:'Cloth armor, bags & fine threads',max:300},
  {id:'leatherworking',name:'Leatherworking',icon:'🪡',tone:'mint',desc:'Leather equipment & kits',max:300},
  {id:'firstaid',name:'First Aid',icon:'🩹',tone:'blue',desc:'Bandages & field survival',max:300}
];
export const recipes: Recipe[] = [
  {id:'r1',profession:'alchemy',name:'Minor Healing Potion',level:1,skillTo:55,crafts:18,materials:[['Peacebloom',1],['Silverleaf',1],['Empty Vial',1]],icon:'🧪'},
  {id:'r2',profession:'alchemy',name:'Elixir of Lion’s Strength',level:15,skillTo:85,crafts:16,materials:[['Earthroot',1],['Silverleaf',1],['Empty Vial',1]],icon:'🧴'},
  {id:'r3',profession:'alchemy',name:'Lesser Healing Potion',level:55,skillTo:110,crafts:20,materials:[['Minor Healing Potion',1],['Briarthorn',1]],icon:'🧪'},
  {id:'r4',profession:'alchemy',name:'Healing Potion',level:110,skillTo:155,crafts:20,materials:[['Bruiseweed',1],['Briarthorn',1],['Leaded Vial',1]],icon:'💗'},
  {id:'r5',profession:'blacksmithing',name:'Rough Sharpening Stone',level:1,skillTo:55,crafts:24,materials:[['Rough Stone',1]],icon:'🪨'},
  {id:'r6',profession:'blacksmithing',name:'Copper Chain Belt',level:35,skillTo:75,crafts:18,materials:[['Copper Bar',6]],icon:'🛡️'},
  {id:'r7',profession:'cooking',name:'Spice Bread',level:1,skillTo:40,crafts:20,materials:[['Simple Flour',1],['Mild Spices',1]],icon:'🥖'},
  {id:'r8',profession:'cooking',name:'Roasted Boar Meat',level:10,skillTo:55,crafts:20,materials:[['Chunk of Boar Meat',1]],icon:'🍖'},
  {id:'r9',profession:'enchanting',name:'Runed Copper Rod',level:1,skillTo:50,crafts:1,materials:[['Copper Rod',1],['Strange Dust',1],['Lesser Magic Essence',1]],icon:'🪄'},
  {id:'r10',profession:'engineering',name:'Rough Blasting Powder',level:1,skillTo:45,crafts:22,materials:[['Rough Stone',1]],icon:'💥'},
  {id:'r11',profession:'tailoring',name:'Bolt of Linen Cloth',level:1,skillTo:45,crafts:24,materials:[['Linen Cloth',2]],icon:'🧶'},
  {id:'r12',profession:'leatherworking',name:'Light Leather',level:1,skillTo:45,crafts:20,materials:[['Ruined Leather Scraps',3]],icon:'🟤'},
  {id:'r13',profession:'firstaid',name:'Linen Bandage',level:1,skillTo:45,crafts:20,materials:[['Linen Cloth',1]],icon:'🩹'}
];
export const pets: Pet[] = [
  {id:'p1',name:'Mechanical Squirrel',kind:'Crafted',source:'Engineering',location:'Crafted by Engineers',rarity:'Uncommon',icon:'🐿️',tone:'peach'},
  {id:'p2',name:'Pet Bombling',kind:'Crafted',source:'Engineering',location:'Engineering recipe',rarity:'Rare',icon:'💣',tone:'blue'},
  {id:'p3',name:'Tiny Crimson Whelpling',kind:'Dropped',source:'Creature drop',location:'Wetlands',rarity:'Rare',icon:'🐉',tone:'pink'},
  {id:'p4',name:'Dark Whelpling',kind:'Dropped',source:'Creature drop',location:'Dustwallow Marsh',rarity:'Rare',icon:'🐲',tone:'lilac'},
  {id:'p5',name:'Ancona Chicken',kind:'Vendor',source:'Pet vendor',location:'Thousand Needles',rarity:'Common',icon:'🐓',tone:'gold'},
  {id:'p6',name:'Snowshoe Rabbit',kind:'Vendor',source:'Pet vendor',location:'Dun Morogh',rarity:'Common',icon:'🐇',tone:'blue'},
  {id:'p7',name:'Prairie Dog',kind:'Vendor',source:'Pet vendor',location:'Thunder Bluff',rarity:'Common',icon:'🐾',tone:'mint'},
  {id:'p8',name:'Cornish Rex Cat',kind:'Vendor',source:'Pet vendor',location:'Elwynn Forest',rarity:'Common',icon:'🐈',tone:'peach'},
  {id:'p9',name:'Cockatiel',kind:'Vendor',source:'Pet vendor',location:'Booty Bay',rarity:'Common',icon:'🦜',tone:'gold'},
  {id:'p10',name:'Wood Frog',kind:'Vendor',source:'Limited vendor',location:'Darkmoon Faire',rarity:'Uncommon',icon:'🐸',tone:'mint'},
  {id:'p11',name:'Hyacinth Macaw',kind:'Dropped',source:'Creature drop',location:'Stranglethorn Vale',rarity:'Epic',icon:'🦜',tone:'pink'},
  {id:'p12',name:'Black Kingsnake',kind:'Vendor',source:'Pet vendor',location:'Orgrimmar',rarity:'Common',icon:'🐍',tone:'lilac'}
];
