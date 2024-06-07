import { Company } from '../../../store/slice/auth.slice';

export const getPdfHeader = (companyDetails: Company) => {
  return `<div style="display: flex; justify-content: space-between; margin-bottom: 20px; width:100%;">
         
        <img src="${companyDetails.CompanyLogo}" style="width:100px; object-fit: cover;" alt="Company Logo">

          <div style="text-align: end;">
            <p>${companyDetails.CompanyName}</p>
            <p>${companyDetails.CompanyPhone}</p>
            <p>${companyDetails.CompanyEmail}</p>
            <p>${companyDetails.CompanyAddress}</p>
          </div>
        </div>`;
};
