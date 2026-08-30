export const OnboardingBanner = () => {
  return (
    <div className="flex justify-center items-center h-full z-1 relative">
      <div className="absolute -top-16 h-full w-full z-0 h-screen">
        <div className="flex flex-col h-screen">
          <div className="h-16 flex items-center justify-start px-8 bg-black">
            <div className="">
              <img src={'/images/acadimic-dark.svg'} alt="logo" className="h-7" />
            </div>
          </div>
          <div className="bg-gradient-to-b from-black flex-1"></div>
          <div className="bg-gradient-to-t from-black flex-1"></div>
        </div>
      </div>
      <div className="h-full">
        <img className="w-full object-cover" src="/images/onboarding2.jpg" alt="onboarding" />
      </div>
    </div>
  );
};
