"use client";

export default function AadsBanner() {
  return (
    <div className="w-full my-4 flex flex-col items-center justify-center">
      <div className="text-[10px] text-gray-500 font-mono mb-1 uppercase tracking-wider">
        Sponsered Advertisement
      </div>
      <div
        id="frame"
        className="w-full max-w-4xl p-2 rounded-2xl bg-gray-900/60 border border-gray-800/80 backdrop-blur-md flex justify-center items-center overflow-hidden shadow-lg"
      >
        <iframe
          data-aa="2453327"
          src="https://acceptable.a-ads.com/2453327/?size=Adaptive"
          className="border-0 p-0 w-full md:w-[70%] h-[90px] overflow-hidden block mx-auto"
          title="APN Network Sponsor Ad"
        />
      </div>
    </div>
  );
}