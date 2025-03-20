// Function to generate a consistent color based on email
export const getEmailColor = (email: string, withBackground: boolean = false) => {
  const colors = withBackground ? [
    'text-blue-600 bg-blue-50',
    'text-emerald-600 bg-emerald-50',
    'text-purple-600 bg-purple-50',
    'text-orange-600 bg-orange-50',
    'text-pink-600 bg-pink-50',
    'text-teal-600 bg-teal-50',
    'text-indigo-600 bg-indigo-50',
    'text-rose-600 bg-rose-50'
  ] : [
    'text-blue-600',
    'text-emerald-600',
    'text-purple-600',
    'text-orange-600',
    'text-pink-600',
    'text-teal-600',
    'text-indigo-600',
    'text-rose-600'
  ];
  
  const hash = email.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};
