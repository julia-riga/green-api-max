export type Credentials = {
  idInstance: string
  apiTokenInstance: string
  apiUrl: string
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export type ChatMessage = {
  key: string
  idMessage?: string
  chatId: string
  text: string
  direction: 'in' | 'out'
  timestamp: number
  status: MessageStatus
}

export type Chat = {
  chatId: string
  title: string
  phone?: string
  messages: ChatMessage[]
  unread: number
}

export type NotificationBody = {
  typeWebhook?: string
  timestamp?: number
  idMessage?: string
  senderData?: {
    chatId?: string
    chatName?: string
    sender?: string
    senderName?: string
    senderContactName?: string
    senderPhoneNumber?: number
  }
  messageData?: {
    typeMessage?: string
    textMessageData?: { textMessage?: string }
    extendedTextMessageData?: { text?: string }
  }
  status?: string
  chatId?: string
}

export type ReceiveNotificationResponse = {
  receiptId: number
  body: NotificationBody
} | null
