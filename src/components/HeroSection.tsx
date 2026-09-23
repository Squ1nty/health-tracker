export default function HeroSection(){
  return(
    <div className="w-full min-h-svh grid place-items-center">
      <div className="w-full flex flex-col items-center gap-2">
        <h1 className="text-3xl font-bold text-center">Welcome to <span className='text-nowrap text-5xl'><br />Health Tracker!</span></h1>
        <p className="text-center text-gray-600">Track your health and wellness goals with ease.</p>
      </div>
      <div className="mt-10 w-full flex flex-col items-center gap-2">
        <p>Login or Sign up to get started!</p>
      </div>
    </div>

  );
}