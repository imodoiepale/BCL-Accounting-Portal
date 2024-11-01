// lib/googleAuth.ts
import { google } from 'googleapis';

export const oauth2Client = new google.auth.OAuth2(
  "342538819907-2v86oir8ip9m4nvurqs6g4j1ohsqc2sg.apps.googleusercontent.com",
  "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",
  process.env.NODE_ENV === 'development' 
    ? "https://bcl-accounting-client-portal.vercel.app/auth/callback/google"
    : "http://localhost:3000/auth/callback/google"
);

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose',
  'profile',
  'email'
];