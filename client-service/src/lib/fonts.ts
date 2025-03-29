import localFont from 'next/font/local'

export const Rochester = localFont({
  src: [
    {
      path: '../../public/fonts/Rochester-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-Rochester'
})
