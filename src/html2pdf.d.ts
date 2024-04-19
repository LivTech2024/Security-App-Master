/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'html2pdf.js' {
  const html2pdf: {
    (): any
    from: (element: HTMLElement) => any
    set: (options: any) => any
    save: () => any
    toPdf: () => any
    get: (type: string) => any
  }
  export default html2pdf
}
