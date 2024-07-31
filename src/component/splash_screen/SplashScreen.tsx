import favicon from '../../../public/favicon.png';

const SplashScreen = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-onSurface">
      <img
        src={favicon}
        alt="TPS Logo"
        className="animate-fadeIn scale-95 transform transition-transform duration-[2000ms] ease-in-out w-[200px]"
      />
    </div>
  );
};

export default SplashScreen;
