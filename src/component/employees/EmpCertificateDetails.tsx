import { useState } from "react";
import { IEmpCertificatesDetails } from "../../@types/database";
import { MdClose } from "react-icons/md";

const EmpCertificateDetails = () => {
  const [certificates, setCertificates] = useState<IEmpCertificatesDetails[]>([
    { CertificateName: "", CertificateDoc: "" },
  ]);

  const handleNameChange = (index: number, value: string) => {
    const updatedCertificates = [...certificates];
    updatedCertificates[index].CertificateName = value;
    setCertificates(updatedCertificates);
  };

  const handlePdfChange = (index: number, file: File) => {
    const updatedCertificates = [...certificates];
    updatedCertificates[index].CertificateDoc = file.name;
    setCertificates(updatedCertificates);
  };

  const handleAddMore = () => {
    setCertificates([
      ...certificates,
      { CertificateName: "", CertificateDoc: "" },
    ]);
  };

  const handleRemove = (index: number) => {
    const updatedCertificates = certificates.filter((_, i) => i !== index);
    setCertificates(updatedCertificates);
  };
  return (
    <div className="space-y-4">
      {certificates.map((certificate, index) => (
        <div key={index} className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="Certificate Name"
            className="border border-gray-300 p-2 rounded"
            value={certificate.CertificateName}
            onChange={(e) => handleNameChange(index, e.target.value)}
          />
          <input
            type="file"
            accept="application/pdf"
            className="border border-gray-300 p-2 rounded"
            onChange={(e) =>
              handlePdfChange(index, e.target.files?.[0] as File)
            }
          />
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
        Add More
      </button>
    </div>
  );
};

export default EmpCertificateDetails;
