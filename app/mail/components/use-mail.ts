import { atom, useAtom } from 'jotai'
import { Mail } from './types'

type MailState = {
  selected: string | null
  mail: Mail[]
}

const mailAtom = atom<MailState>({
  selected: null,
  mail: [],
})

export function useMail() {
  return useAtom(mailAtom)
}