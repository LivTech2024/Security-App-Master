/* eslint-disable @typescript-eslint/no-explicit-any */
export const loadScript = (url: string, callback: () => void) => {
  const script = document.createElement('script');
  script.type = 'text/javascript';

  if ((script as any).readyState) {
    (script as any).onreadystatechange = () => {
      if (
        (script as any).readyState === 'loaded' ||
        (script as any).readyState === 'complete'
      ) {
        (script as any).onreadystatechange = null;
        callback();
      }
    };
  } else {
    script.onload = () => {
      callback();
    };
  }

  script.src = url;
  document.getElementsByTagName('head')[0].appendChild(script);
};
