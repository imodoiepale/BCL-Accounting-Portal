import { atom, useAtom } from 'jotai'
import { GmailMessage } from '../types'

type MailState = {
  selected: string | null
  mail: GmailMessage[]
}

const mailAtom = atom<MailState>({
  selected: null,
  mail: [],
})

export function useMail() {
  return useAtom(mailAtom)
}