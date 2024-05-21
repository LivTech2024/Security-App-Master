import { useAuthState } from '../store';

const Footer = () => {
  const { company } = useAuthState();
  return (
    <footer className="flex w-full flex-col items-center ">
      <div className="flex w-full  flex-col items-center bg-gray-200 px-4 lg:px-36">
        <div className="flex w-full max-w-[1280px] flex-col py-4">
          <h2 className="text-center text-xs">
            &copy;{new Date().getFullYear()} {company?.CompanyName}. All rights
            reserved.
          </h2>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
