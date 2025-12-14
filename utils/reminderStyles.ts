import { CorLembrete } from '../types';

export const COR_ESTILOS: Record<CorLembrete, {
  bg: string;
  bgLight: string;
  border: string;
  text: string;
  pin: string;
  gradientStart: string;
  gradientEnd: string;
}> = {
  rose: {
    bg: 'bg-rose-100',
    bgLight: 'bg-rose-50',
    border: 'border-rose-300',
    text: 'text-rose-900',
    pin: 'bg-rose-500',
    gradientStart: '#ffe4e6', // rose-100
    gradientEnd: '#fecdd3'    // rose-200
  },
  blush: {
    bg: 'bg-red-100',
    bgLight: 'bg-red-50',
    border: 'border-red-300',
    text: 'text-red-900',
    pin: 'bg-red-500',
    gradientStart: '#fee2e2', // red-100
    gradientEnd: '#fecaca'    // red-200
  },
  peach: {
    bg: 'bg-orange-100',
    bgLight: 'bg-orange-50',
    border: 'border-orange-300',
    text: 'text-orange-900',
    pin: 'bg-orange-500',
    gradientStart: '#ffedd5', // orange-100
    gradientEnd: '#fed7aa'    // orange-200
  },
  sand: {
    bg: 'bg-amber-100',
    bgLight: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-900',
    pin: 'bg-amber-600',
    gradientStart: '#fef3c7', // amber-100
    gradientEnd: '#fde68a'    // amber-200
  },
  mint: {
    bg: 'bg-emerald-100',
    bgLight: 'bg-emerald-50',
    border: 'border-emerald-300',
    text: 'text-emerald-900',
    pin: 'bg-emerald-500',
    gradientStart: '#d1fae5', // emerald-100
    gradientEnd: '#a7f3d0'    // emerald-200
  },
  sage: {
    bg: 'bg-green-100',
    bgLight: 'bg-green-50',
    border: 'border-green-300',
    text: 'text-green-900',
    pin: 'bg-green-600',
    gradientStart: '#dcfce7', // green-100
    gradientEnd: '#bbf7d0'    // green-200
  },
  sky: {
    bg: 'bg-sky-100',
    bgLight: 'bg-sky-50',
    border: 'border-sky-300',
    text: 'text-sky-900',
    pin: 'bg-sky-500',
    gradientStart: '#e0f2fe', // sky-100
    gradientEnd: '#bae6fd'    // sky-200
  },
  periwinkle: {
    bg: 'bg-indigo-100',
    bgLight: 'bg-indigo-50',
    border: 'border-indigo-300',
    text: 'text-indigo-900',
    pin: 'bg-indigo-500',
    gradientStart: '#e0e7ff', // indigo-100
    gradientEnd: '#c7d2fe'    // indigo-200
  },
  lavender: {
    bg: 'bg-purple-100',
    bgLight: 'bg-purple-50',
    border: 'border-purple-300',
    text: 'text-purple-900',
    pin: 'bg-purple-500',
    gradientStart: '#f3e8ff', // purple-100
    gradientEnd: '#e9d5ff'    // purple-200
  },
  mist: {
    bg: 'bg-slate-100',
    bgLight: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-900',
    pin: 'bg-slate-500',
    gradientStart: '#f1f5f9', // slate-100
    gradientEnd: '#e2e8f0'    // slate-200
  }
};
