import { useAuthState } from '../../store';

const SplashScreen = () => {
  const { company } = useAuthState();
  return (
    <div className="flex h-screen items-center justify-center bg-surface dark:bg-surfaceDark ">
      <div className="animate-bounce flex flex-col gap-4 items-center justify-center">
        {company?.CompanyLogo && (
          <img
            alt="Loading"
            src={company.CompanyLogo}
            className="w-[120px] object-cover"
          />
        )}
        <div className="text-3xl font-semibold  text-primary">
          {company?.CompanyName ?? 'Loading'}
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
