import { 
  bluerupee, 
  bomb,
  goldrupee, 
  greenrupee, 
  redrupee, 
  silverrupee, 
  rupoor, 
  undug 
} from '../assets/images'

export const imageMap: Record<string, string> = {
  'bluerupee': bluerupee,
  'bomb': bomb,
  'goldrupee': goldrupee,
  'greenrupee': greenrupee,
  'redrupee': redrupee,
  'silverrupee': silverrupee,
  'rupoor': rupoor,
  'undug': undug,
}

export function getImageForItem(itemName: string): string {
  const imageName = itemName.toLowerCase().replace(/\s+/g, '');
  return imageMap[imageName] || undug
}
