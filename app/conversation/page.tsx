import { Conversation } from "./conversation";



export default function Home() {
  return (
    <main className="flex flex-col items-center justify-between p-6">
      <div className=" w-full items-center justify-between">
      <h1>Conversation</h1>
       <Conversation/>
      </div>
    </main>
  );
}


