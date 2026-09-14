export default function HeroSection(){
  return(
    <div className="w-full h-svh flex flex-col items-center justify-center gap-2">
      <h1 className="leading-1 text-3xl font-bold text-center">Welcome to <span className='text-nowrap text-5xl'><br />Health Tracker!</span></h1>
      <p className="text-center text-gray-600">Track your health and wellness goals with ease.</p>
    </div>
  );
}