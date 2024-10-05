import React from 'react';
import { closeModalLoader, showModalLoader } from '../utilities/TsxUtils';

export const useShowLoader = (loading: boolean) => {
  React.useEffect(() => {
    if (loading) {
      showModalLoader({});
    } else {
      closeModalLoader();
    }
    return () => closeModalLoader();
  }, [loading]);
};
