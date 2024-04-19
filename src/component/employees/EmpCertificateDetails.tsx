import React from 'react';
import { IEmpCertificatesDetails } from '../../@types/database';
import { MdClose } from 'react-icons/md';
import { showSnackbar } from '../../utilities/TsxUtils';
import InputWithTopHeader from '../../common/inputs/InputWithTopHeader';

export interface EmpCertificates
  extends Omit<IEmpCertificatesDetails, 'CertificateDoc'> {
  CertificateDoc: File | string;
}

const EmpCertificateDetails = ({
  certificates,
  setCertificates,
}: {
  certificates: EmpCertificates[];
  setCertificates: React.Dispatch<React.SetStateAction<EmpCertificates[]>>;
}) => {
  const handleNameChange = (index: number, value: string) => {
    const updatedCertificates = [...certificates];
    updatedCertificates[index].CertificateName = value;
    setCertificates(updatedCertificates);
  };

  const handlePdfChange = (index: number, file: File) => {
    if (file.size > 200000) {
      showSnackbar({
        message: 'File size must be less than 200kb',
        type: 'error',
      });
      return;
    }
    const updatedCertificates = [...certificates];
    updatedCertificates[index].CertificateDoc = file;
    setCertificates(updatedCertificates);
  };

  const handleAddMore = () => {
    // Check if any of the existing certificates are incomplete
    if (
      certificates.some(
        (certificate) =>
          !certificate.CertificateName || !certificate.CertificateDoc
      )
    ) {
      showSnackbar({
        message: 'Please complete all certificates before adding more',
        type: 'error',
      });
      return;
    }
    setCertificates([
      ...certificates,
      { CertificateName: '', CertificateDoc: '' },
    ]);
  };

  const handleRemove = (index: number) => {
    const updatedCertificates = certificates.filter((_, i) => i !== index);
    setCertificates(updatedCertificates);
  };
  return (
    <div className="space-y-4">
      {certificates.map((certificate, index) => (
        <div
          key={index}
          className="flex items-center space-x-4 justify-between"
        >
          <div className="flex flex-col">
            <InputWithTopHeader
              placeholder="Certificate Name"
              className="mx-0"
              value={certificate.CertificateName}
              onChange={(e) => handleNameChange(index, e.target.value)}
            />
            {typeof certificate.CertificateDoc === 'string' &&
              certificate.CertificateDoc.startsWith('https') && (
                <a
                  href={certificate.CertificateDoc}
                  target="_blank"
                  className=" text-textPrimaryBlue cursor-pointer mt-1"
                >
                  Click here to view certificate
                </a>
              )}
          </div>
          <input
            id="fileUpload"
            type="file"
            accept="application/pdf"
            className={`border border-gray-300 p-2 rounded ${
              typeof certificate.CertificateDoc === 'string' &&
              certificate.CertificateDoc.startsWith('https') &&
              'hidden'
            }`}
            onChange={(e) =>
              handlePdfChange(index, e.target.files?.[0] as File)
            }
          />
          {typeof certificate.CertificateDoc === 'string' &&
            certificate.CertificateDoc.startsWith('https') && (
              <label
                htmlFor="fileUpload"
                className="flex justify-end text-textPrimaryBlue cursor-pointer"
              >
                Click here to upload new pdf
              </label>
            )}
          {certificates.length > 1 && (
            <MdClose
              className="text-textPrimaryRed text-xl cursor-pointer"
              onClick={() => handleRemove(index)}
            />
          )}
        </div>
      ))}

      <button
        type="button"
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleAddMore}
      >
        Add {certificates.length > 0 ? 'More' : 'New'}
      </button>
    </div>
  );
};

export default EmpCertificateDetails;
