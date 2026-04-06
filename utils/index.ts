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
