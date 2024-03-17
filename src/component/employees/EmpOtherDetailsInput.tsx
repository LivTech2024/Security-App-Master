import React, { ChangeEvent, useState } from "react";
import empDefaultPlaceHolder from "../../../public/assets/avatar.png";

const ImageUpload = ({
  empImageBase64,
  setEmpImageBase64,
}: {
  empImageBase64: string | null;
  setEmpImageBase64: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEmpImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  //PDF
  const [pdf, setPdf] = useState<File | null>(null);

  const handlePdfUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdf(file);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="p-4 bg-gray-100 rounded-lg shadow-md">
        <h2 className="text-lg font-medium mb-4">Upload Employee Image</h2>
        <div className="flex items-center">
          <label htmlFor="image" className="mr-4 cursor-pointer">
            <img
              src={empImageBase64 || empDefaultPlaceHolder}
              alt={empImageBase64 ? "Uploaded" : "No Image Uploaded"}
              className="w-32 h-32 object-cover rounded"
            />
            <input
              id="image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
          <div className="flex flex-col">
            <label
              htmlFor="fileInput"
              className="block mb-2 cursor-pointer text-textPrimaryBlue"
            >
              Choose File
            </label>
            <input
              id="fileInput"
              type="file"
              className="hidden"
              onChange={handleImageUpload}
            />
            <div className="text-textTertiary leading-4">
              {empImageBase64
                ? "Image uploaded successfully"
                : "No image uploaded"}
            </div>
          </div>
        </div>
      </div>
      {/* PDF */}
      <div className=" p-4 bg-gray-100 rounded-lg shadow-md flex flex-col w-full">
        <div className=" mb-4">
          <span className="font-medium text-lg">Upload Documents</span>
          <span className="font-normal text-xs ml-2">
            (Certification, License, Training)
          </span>
        </div>
        <div className="flex items-center gap-4 w-full justify-between">
          <label
            htmlFor="pdf"
            className="flex flex-col items-center gap-2 cursor-pointer min-w-24"
          >
            <div className="flex items-center justify-center min-w-12 h-12 bg-blue-500 text-white rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <span className="">Choose PDF</span>
            <input
              id="pdf"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handlePdfUpload}
            />
          </label>

          <div className="text-textTertiary line-clamp-1 w-full">
            {pdf ? "PDF uploaded: " + pdf.name : "No PDF uploaded"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
