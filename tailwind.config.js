/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#FFFFFF', // background colors of components like card, buttons, etc.
        onSurface: '#000000', // text and icon colors of components like card, buttons, etc.

        background: '#f7f7f7',

        primaryGold: '#fbbf39',

        primary: '#000000',
        primaryVariant: '#3A3B3C',
        primaryGreen: '#22c55e',
        primaryRed: '#ef4444',
        secondary: '#0E5FFF',

        //text colors
        textPrimary: '#000000',
        textSecondary: '#3E3F43',
        textTertiary: '#667781',
        textQuaternary: '#A3A3A3',
        textSecondaryBlue: '#508BFF',
        textPrimaryBlue: '#0E5FFF',
        textPrimaryRed: '#ef4444',
        textPrimaryGreen: '#23CFAB',

        //button hover bg
        greenButtonHoverBg: '#16a34a',
        greenButtonActiveBg: '#15803d',
        blueButtonHoverBg: '#0e5effd8',
        blueButtonActiveBg: '#0e5efffa',
        blackButtonHoverBg: '#000000bb',
        blackButtonActiveBg: '#000000d9',
        tableOddColor: '#fbfbfb',

        secondaryBlueBg: '#60a5fa',
        switchBg: '#C7C7C7',
        switchPrimaryBlueBg: '#2563eb',
        switchSecondaryBlueBg: '#60a5fa',

        whiteButtonBg: '#FFFF',
        whiteButtonHoverBg: '#ffffff7e',
        whiteButtonActiveBg: '#ffffffba',

        grayButtonBg: '#e5e7eb',
        grayButtonHoverBg: '#e2e8f0',
        grayButtonActiveBg: '#d1d5db',

        onHoverBg: '#F4F4F4',

        shimmerColor: '#e3e3e3',
        inputBorder: '#0000001A',
      },
      animation: {
        fadeIn: 'fadeIn 1s ease-in-out',
        shine: 'shine 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        shine: {
          '0%': { backgroundPosition: '-200%' },
          '100%': { backgroundPosition: '200%' },
        },
      },
    },
  },
  plugins: [],
};
