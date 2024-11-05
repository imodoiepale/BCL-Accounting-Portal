export interface Mail {
  id: string
  name: string
  email: string
  subject: string
  text: string
  date: string
  read: boolean
  labels: string[]
}

export interface Account {
  email: string
  token: {
    access_token: string
    expires_in: number
  }
  messages?: GmailMessage[]
}

export interface GmailMessage {
  id: string
  payload: {
    headers: Array<{
      name: string
      value: string
    }>
  }
  snippet: string
  internalDate: string
  labelIds?: string[]
}

export interface FormattedMail {
  id: string
  name: string
  email: string
  subject: string
  text: string
  date: string
  read: boolean
  labels: string[]
}