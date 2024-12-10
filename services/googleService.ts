export class GoogleService {
  private static instance: GoogleService;
  private initialized = false;
  private tokenClient: any;

  private constructor() {}

  static getInstance(): GoogleService {
    if (!GoogleService.instance) {
      GoogleService.instance = new GoogleService();
    }
    return GoogleService.instance;
  }

  private loadGapiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google API script'));
      document.head.appendChild(script);
    });
  }

  private loadGsiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load GSI script'));
      document.head.appendChild(script);
    });
  }

  async initClient(): Promise<void> {
    if (this.initialized) return;

    try {
      await Promise.all([this.loadGapiScript(), this.loadGsiScript()]);

      await new Promise<void>((resolve) => {
        window.gapi.load('client', { callback: resolve });
      });

      await window.gapi.client.init({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
        discoveryDocs: ['https://people.googleapis.com/$discovery/rest?version=v1'],
      });

      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/contacts.readonly',
        callback: () => {}, // We'll handle the callback manually
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Google API client:', error);
      throw new Error('Google API initialization failed');
    }
  }

  async requestAccessToken(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Token client not initialized'));
        return;
      }

      this.tokenClient.callback = async (response: any) => {
        if (response.error) {
          reject(response);
          return;
        }
        resolve();
      };

      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  async loadContacts() {
    try {
      if (!this.initialized) {
        await this.initClient();
      }

      await this.requestAccessToken();

      const response = await window.gapi.client.people.people.connections.list({
        resourceName: 'people/me',
        pageSize: 100,
        personFields: 'names,emailAddresses,phoneNumbers',
        sortOrder: 'FIRST_NAME_ASCENDING'
      });

      return (response.result.connections || [])
        .map((person: { names: { displayName: any; }[]; emailAddresses: { value: any; }[]; phoneNumbers: { value: any; }[]; }) => ({
          name: person.names?.[0]?.displayName || 'No Name',
          email: person.emailAddresses?.[0]?.value || '',
          phone: person.phoneNumbers?.[0]?.value || ''
        }))
        .filter((contact: { email: any; phone: any; }) => contact.email || contact.phone);
    } catch (error) {
      console.error('Error loading contacts:', error);
      throw new Error('Failed to load contacts');
    }
  }
}

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export const googleService = GoogleService.getInstance();