import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../common/PageHeader';
import NoSearchResult from '../../common/NoSearchResult';
import { IFLHACollection } from '../../@types/database';
import DbShift from '../../firebase_configs/DB/DbShift';
import generateFLHAHtml from '../../utilities/pdf/generateFLHAPdf';
import { htmlToPdf } from '../../API/HtmlToPdf';
import { downloadPdf } from '../../utilities/pdf/common/downloadPdf';
import { errorHandler } from '../../utilities/CustomError';
import { useAuthState, useUIState } from '../../store';
import Button from '../../common/button/Button';

const FLHAView = () => {
  const [searchParam] = useSearchParams();

  const { company } = useAuthState();

  const { setLoading: showLoader } = useUIState();

  const flhaId = searchParam.get('id');

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<IFLHACollection | null>(null);

  useEffect(() => {
    if (!flhaId) return;
    DbShift.getFLHAById(flhaId).then((snap) => {
      const flhaData = snap.data() as IFLHACollection;
      if (flhaData) {
        setData(flhaData);
      }
      setLoading(false);
    });
  }, [flhaId]);

  const handleDownloadClick = async () => {
    if (!data || !company) return;
    try {
      showLoader(true);

      const html = generateFLHAHtml(data, company);

      const response = await htmlToPdf({ file_name: 'FLHA.pdf', html });

      downloadPdf(response, 'FLHA.pdf');

      showLoader(false);
    } catch (error) {
      showLoader(false);
      errorHandler(error);
      console.log(error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const writeHTML = (frame: any) => {
    if (!data || !company) return;
    const html = generateFLHAHtml(data, company);
    if (!frame) {
      return;
    }
    const doc = frame.contentDocument;
    doc.open();
    doc.write(html);
    doc.close();
  };

  if (!data && !loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <NoSearchResult />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6 ">
        <PageHeader title="Field Level Hazard Assessment" />

        <div className="h-[80vh] bg-shimmerColor w-full animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader
        title="Field Level Hazard Assessment"
        rightSection={
          <Button label="Download" onClick={handleDownloadClick} type="black" />
        }
      />
      <div className="bg-surface shadow-md rounded-lg p-4 h-[calc(100vh-200px)]">
        <iframe
          className="bg-surface"
          ref={writeHTML}
          style={{ minWidth: '100%', height: '100%' }}
        ></iframe>
      </div>
    </div>
  );
};

export default FLHAView;
