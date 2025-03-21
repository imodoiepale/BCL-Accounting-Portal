declare module 'emailjs-imap-client' {
  interface ClientOptions {
    auth: {
      user: string;
      pass: string;
    };
    useSecureTransport?: boolean;
    logLevel?: string;
  }

  interface SearchOptions {
    byUid?: boolean;
    bodies?: string[];
  }

  interface Message {
    uid: number;
    flags: Set<string>;
    parts: Array<{
      body: string;
      which: string;
    }>;
  }

  class Client {
    constructor(host: string, port: number, options: ClientOptions);
    connect(): Promise<void>;
    selectMailbox(name: string): Promise<void>;
    search(mailbox: string, criteria: string[][], options?: SearchOptions): Promise<Message[]>;
    setFlags(mailbox: string, uid: number, flags: string[]): Promise<void>;
    delFlags(mailbox: string, uid: number, flags: string[]): Promise<void>;
    moveMessage(source: string, uid: number, destination: string): Promise<void>;
    logout(): Promise<void>;
  }

  export default Client;
}
