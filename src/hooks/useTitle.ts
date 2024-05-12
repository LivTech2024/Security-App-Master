import React from 'react';

export const useTitle = (title: string) => {
  const documentDefined = typeof document !== 'undefined';
  const originalTitle = React.useRef(documentDefined ? document.title : null);

  React.useEffect(() => {
    if (!documentDefined) return;

    if (document.title !== title) document.title = title;

    return () => {
      document.title = originalTitle.current || 'Tacttik - Admin App';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);
};
