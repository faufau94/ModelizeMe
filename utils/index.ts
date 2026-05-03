// Utility function to generate a CSS class for team colors
export const teamColorClass = (color: string | undefined | null) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  };
  return colorMap[color || 'blue'] || 'bg-blue-500';
};

// Detect diacritics (accented chars) in a string — used to warn the user before submission.
export const hasDiacritics = (str: string): boolean => {
  if (!str) return false;
  return /[̀-ͯ]/.test(str.normalize('NFD'));
};

// Sanitize a string into a valid SQL identifier:
//  1. Unicode normalize (NFD) and strip diacritics
//  2. Replace any non-alphanumeric run with a single underscore
//  3. Trim leading/trailing underscores
export const slugifyIdentifier = (str: string): string => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};
