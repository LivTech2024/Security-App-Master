import { IoArrowBackCircle } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  redirectUrl?: string;
  rightSection?: React.ReactNode;
}

const PageHeader = ({ title, redirectUrl, rightSection }: PageHeaderProps) => {
  const navigate = useNavigate();
  return (
    <div className="flex justify-between w-full p-4 rounded bg-primaryGold  items-center text-surface">
      <div
        onClick={() => (redirectUrl ? navigate(redirectUrl) : navigate(-1))}
        className="flex items-center gap-4 cursor-pointer "
      >
        <div className="cursor-pointer">
          <IoArrowBackCircle className="h-6 w-6" />
        </div>
        <div className="font-semibold text-lg">{title}</div>
      </div>
      {rightSection}
    </div>
  );
};

export default PageHeader;
