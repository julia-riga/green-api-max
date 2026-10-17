import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'
import {
  checkAccount,
  deleteNotification,
  extractText,
  receiveNotification,
  sendMessage as sendMessageApi,
  setHttpApiSettings,
} from '../api/greenApi'
import type {
  Chat,
  ChatMessage,
  Credentials,
  MessageStatus,
  NotificationBody,
} from '../types'
import { formatPhone, newKey, normalizePhone } from '../utils/format'

type State = {
  credentials: Credentials | null
  instanceState: string
  chats: Chat[]
  activeChatId: string | null
  sidebarOpen: boolean
}

type Action =
  | { type: 'hydrate'; state: Partial<State> }
  | { type: 'login'; credentials: Credentials; instanceState: string }
  | { type: 'logout' }
  | { type: 'setActive'; chatId: string | null }
  | { type: 'setSidebar'; open: boolean }
  | { type: 'upsertChat'; chat: Pick<Chat, 'chatId' | 'title' | 'phone'> }
  | { type: 'addMessage'; message: ChatMessage; title?: string; phone?: string }
  | {
      type: 'patchMessage'
      chatId: string
      match: { key?: string; idMessage?: string }
      patch: Partial<ChatMessage>
    }
  | { type: 'markRead'; chatId: string }

const STORAGE_KEY = 'max-chat-state'

function loadState(): State {
  const empty: State = {
    credentials: null,
    instanceState: '',
    chats: [],
    activeChatId: null,
    sidebarOpen: true,
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as Partial<State>
    return {
      ...empty,
      ...parsed,
      sidebarOpen: true,
    }
  } catch {
    return empty
  }
}

function sortChats(chats: Chat[]): Chat[] {
  return [...chats].sort((a, b) => {
    const aTime = a.messages.at(-1)?.timestamp ?? 0
    const bTime = b.messages.at(-1)?.timestamp ?? 0
    return bTime - aTime
  })
}

function upsertChatList(
  chats: Chat[],
  chatId: string,
  extra: Partial<Pick<Chat, 'title' | 'phone'>>,
): Chat[] {
  const existing = chats.find((chat) => chat.chatId === chatId)
  if (existing) {
    return chats.map((chat) =>
      chat.chatId === chatId
        ? {
            ...chat,
            title: extra.title || chat.title,
            phone: extra.phone || chat.phone,
          }
        : chat,
    )
  }
  return [
    ...chats,
    {
      chatId,
      title: extra.title || chatId,
      phone: extra.phone,
      messages: [],
      unread: 0,
    },
  ]
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { ...state, ...action.state }
    case 'login':
      return {
        ...state,
        credentials: action.credentials,
        instanceState: action.instanceState,
      }
    case 'logout':
      return {
        credentials: null,
        instanceState: '',
        chats: [],
        activeChatId: null,
        sidebarOpen: true,
      }
    case 'setActive':
      return {
        ...state,
        activeChatId: action.chatId,
        sidebarOpen: action.chatId === null,
        chats: state.chats.map((chat) =>
          chat.chatId === action.chatId ? { ...chat, unread: 0 } : chat,
        ),
      }
    case 'setSidebar':
      return { ...state, sidebarOpen: action.open }
    case 'upsertChat':
      return {
        ...state,
        chats: sortChats(
          upsertChatList(state.chats, action.chat.chatId, action.chat),
        ),
        activeChatId: action.chat.chatId,
        sidebarOpen: false,
      }
    case 'addMessage': {
      const chats = upsertChatList(state.chats, action.message.chatId, {
        title: action.title,
        phone: action.phone,
      }).map((chat) => {
        if (chat.chatId !== action.message.chatId) return chat
        const duplicate = chat.messages.some(
          (message) =>
            (action.message.idMessage &&
              message.idMessage === action.message.idMessage) ||
            message.key === action.message.key,
        )
        if (duplicate) return chat
        const unread =
          action.message.direction === 'in' &&
          state.activeChatId !== chat.chatId
            ? chat.unread + 1
            : chat.unread
        return {
          ...chat,
          title: action.title || chat.title,
          phone: action.phone || chat.phone,
          unread,
          messages: [...chat.messages, action.message],
        }
      })
      return { ...state, chats: sortChats(chats) }
    }
    case 'patchMessage':
      return {
        ...state,
        chats: state.chats.map((chat) => {
          if (chat.chatId !== action.chatId) return chat
          return {
            ...chat,
            messages: chat.messages.map((message) => {
              const byId =
                action.match.idMessage &&
                message.idMessage === action.match.idMessage
              const byKey =
                action.match.key && message.key === action.match.key
              return byId || byKey ? { ...message, ...action.patch } : message
            }),
          }
        }),
      }
    case 'markRead':
      return {
        ...state,
        chats: state.chats.map((chat) =>
          chat.chatId === action.chatId ? { ...chat, unread: 0 } : chat,
        ),
      }
    default:
      return state
  }
}

type ChatContextValue = {
  credentials: Credentials | null
  instanceState: string
  chats: Chat[]
  activeChat: Chat | null
  sidebarOpen: boolean
  login: (credentials: Credentials, instanceState: string) => Promise<void>
  logout: () => void
  openChat: (chatId: string | null) => void
  setSidebarOpen: (open: boolean) => void
  createChat: (phone: string) => Promise<void>
  sendText: (text: string) => Promise<void>
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const handleNotification = useCallback((body: NotificationBody) => {
    const type = body.typeWebhook
    const chatId = body.senderData?.chatId || body.chatId
    const title =
      body.senderData?.senderContactName ||
      body.senderData?.senderName ||
      body.senderData?.chatName
    const phone = body.senderData?.senderPhoneNumber
      ? String(body.senderData.senderPhoneNumber)
      : undefined

    if (type === 'incomingMessageReceived' && chatId) {
      const text = extractText(body)
      if (!text) return
      dispatch({
        type: 'addMessage',
        title,
        phone,
        message: {
          key: body.idMessage || newKey(),
          idMessage: body.idMessage,
          chatId,
          text,
          direction: 'in',
          timestamp: body.timestamp ?? Date.now() / 1000,
          status: 'read',
        },
      })
      return
    }

    if (
      (type === 'outgoingAPIMessageReceived' ||
        type === 'outgoingMessageReceived') &&
      chatId
    ) {
      const text = extractText(body)
      if (body.idMessage) {
        dispatch({
          type: 'patchMessage',
          chatId,
          match: { idMessage: body.idMessage },
          patch: { status: 'sent', idMessage: body.idMessage },
        })
      }
      if (type === 'outgoingMessageReceived' && text) {
        dispatch({
          type: 'addMessage',
          title,
          phone,
          message: {
            key: body.idMessage || newKey(),
            idMessage: body.idMessage,
            chatId,
            text,
            direction: 'out',
            timestamp: body.timestamp ?? Date.now() / 1000,
            status: 'sent',
          },
        })
      }
      return
    }

    if (type === 'outgoingMessageStatus' && chatId && body.idMessage) {
      const statusMap: Record<string, MessageStatus> = {
        sent: 'sent',
        delivered: 'delivered',
        read: 'read',
        failed: 'failed',
        noAccount: 'failed',
      }
      const status = body.status ? statusMap[body.status] : undefined
      if (!status) return
      dispatch({
        type: 'patchMessage',
        chatId,
        match: { idMessage: body.idMessage },
        patch: { status },
      })
    }
  }, [])

  useEffect(() => {
    const credentials = state.credentials
    if (!credentials) return

    const controller = new AbortController()
    let stopped = false

    const loop = async () => {
      while (!stopped) {
        try {
          const notification = await receiveNotification(
            credentials,
            controller.signal,
          )
          if (!notification) continue
          handleNotification(notification.body)
          await deleteNotification(credentials, notification.receiptId)
        } catch (error) {
          if (controller.signal.aborted || stopped) return
          const message = error instanceof Error ? error.message : ''
          if (message.includes('401') || message.includes('403')) {
            dispatch({ type: 'logout' })
            return
          }
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      }
    }

    void loop()
    return () => {
      stopped = true
      controller.abort()
    }
  }, [handleNotification, state.credentials])

  const login = useCallback(
    async (credentials: Credentials, instanceState: string) => {
      dispatch({ type: 'login', credentials, instanceState })
      try {
        await setHttpApiSettings(credentials)
      } catch {
        // Настройки можно выставить и в кабинете GREEN-API.
      }
    },
    [],
  )

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY)
    dispatch({ type: 'logout' })
  }, [])

  const openChat = useCallback((chatId: string | null) => {
    dispatch({ type: 'setActive', chatId })
  }, [])

  const setSidebarOpen = useCallback((open: boolean) => {
    dispatch({ type: 'setSidebar', open })
  }, [])

  const createChat = useCallback(
    async (phone: string) => {
      if (!state.credentials) throw new Error('Нет авторизации')
      const digits = normalizePhone(phone)
      const result = await checkAccount(state.credentials, Number(digits))
      if (!result.exist || !result.chatId) {
        throw new Error('Аккаунт MAX на этом номере не найден')
      }
      dispatch({
        type: 'upsertChat',
        chat: {
          chatId: result.chatId,
          title: formatPhone(digits),
          phone: digits,
        },
      })
    },
    [state.credentials],
  )

  const sendText = useCallback(
    async (text: string) => {
      if (!state.credentials || !state.activeChatId) return
      const key = newKey()
      const chatId = state.activeChatId
      dispatch({
        type: 'addMessage',
        message: {
          key,
          chatId,
          text,
          direction: 'out',
          timestamp: Date.now() / 1000,
          status: 'sending',
        },
      })
      try {
        const idMessage = await sendMessageApi(state.credentials, chatId, text)
        dispatch({
          type: 'patchMessage',
          chatId,
          match: { key },
          patch: { idMessage, status: 'sent' },
        })
      } catch (error) {
        dispatch({
          type: 'patchMessage',
          chatId,
          match: { key },
          patch: { status: 'failed' },
        })
        throw error
      }
    },
    [state.activeChatId, state.credentials],
  )

  const activeChat =
    state.chats.find((chat) => chat.chatId === state.activeChatId) ?? null

  const value = useMemo(
    () => ({
      credentials: state.credentials,
      instanceState: state.instanceState,
      chats: state.chats,
      activeChat,
      sidebarOpen: state.sidebarOpen,
      login,
      logout,
      openChat,
      setSidebarOpen,
      createChat,
      sendText,
    }),
    [
      activeChat,
      createChat,
      login,
      logout,
      openChat,
      sendText,
      setSidebarOpen,
      state.chats,
      state.credentials,
      state.instanceState,
      state.sidebarOpen,
    ],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const value = useContext(ChatContext)
  if (!value) throw new Error('useChat must be used inside ChatProvider')
  return value
}
