import Communication from "./communication";


export default function Home() {
  return (
    <main className="flex flex-col items-center justify-between p-6">
      <div className=" w-full items-center justify-between">
      <h1>Communication & Ticketing</h1>
       <Communication/>
    
      </div>
    </main>
  );
}


