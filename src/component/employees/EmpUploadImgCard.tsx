import React, { ChangeEvent } from "react";
import empDefaultPlaceHolder from "../../../public/assets/avatar.png";

const EmpUploadImgCard = ({
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

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md">
      <h2 className=" font-semibold mb-4">Upload Employee Image</h2>
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
            accept="image/*"
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
  );
};

export default EmpUploadImgCard;
