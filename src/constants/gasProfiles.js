// LPG distributor brands in India
export const CYLINDER_BRANDS = [
  { id: 'indane',  label: 'Indane (IOC)',    color: '#E8002D' },
  { id: 'hp',      label: 'HP Gas (HPCL)',   color: '#003087' },
  { id: 'bharat',  label: 'Bharat Gas (BPCL)', color: '#FF8C00' },
  { id: 'other',   label: 'Other',           color: '#666666' },
];

// Booking URLs / USSD codes by brand
export const BOOKING_INFO = {
  indane:  { phone: '7718955555', ussd: '*7718955555#', url: 'https://ebharatgas.com' },
  hp:      { phone: '9222201122', ussd: '*9222201122#', url: 'https://hindustanpetroleum.com' },
  bharat:  { phone: '7715012345', ussd: '*7715012345#', url: 'https://ebharatgas.com' },
  other:   { phone: null,         ussd: null,            url: null },
};

// Cooking style options shown during onboarding
export const COOKING_STYLES = [
  {
    id:          'simple',
    icon:        '🫖',
    labelKey:    'cookingSimple',
    description: '1–2 items per meal, tea/coffee',
  },
  {
    id:          'moderate',
    icon:        '🍛',
    labelKey:    'cookingModerate',
    description: 'Dal, sabzi, roti/rice daily',
  },
  {
    id:          'elaborate',
    icon:        '🥘',
    labelKey:    'cookingElaborate',
    description: 'Multiple dishes, pressure cooker, frying',
  },
];

// Activity icons for the daily log screen
export const ACTIVITY_CONFIG = [
  { id: 'tea',       icon: '☕', color: '#8B4513' },
  { id: 'breakfast', icon: '🍳', color: '#FF8C00' },
  { id: 'lunch',     icon: '🍛', color: '#228B22' },
  { id: 'dinner',    icon: '🌙', color: '#4B0082' },
  { id: 'extra',     icon: '🔥', color: '#DC143C' },
];
