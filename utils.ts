
import { DoorOption } from './types';

export const getOptionName = <T extends string>(options: DoorOption<T>[], id: T): string => {
  for (const option of options) {
    if (option.id === id) {
      return option.name;
    }
    if (option.subOptions) {
      const subOption = option.subOptions.find(sub => sub.id === id);
      if (subOption) {
        return subOption.name;
      }
    }
  }
  return '不明';
};

export const getProxiedImageUrl = (url?: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return '';
  }
  // Using weserv.nl as an image proxy to bypass potential CORS issues
  const cleanUrl = trimmedUrl.replace(/^https?:\/\//, '');
  return `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&default=${encodeURIComponent(cleanUrl)}&w=200&output=webp`;
};
