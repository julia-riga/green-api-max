import type {
  Credentials,
  NotificationBody,
  ReceiveNotificationResponse,
} from '../types'

function instancePath(
  credentials: Credentials,
  method: string,
  extra = '',
): string {
  return `${credentials.apiUrl}/waInstance${credentials.idInstance}/${method}/${credentials.apiTokenInstance}${extra}`
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function errorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (typeof record.message === 'string' && record.message) return record.message
    if (typeof record.error === 'string' && record.error) return record.error
    if (typeof record.reason === 'string' && record.reason) return record.reason
  }
  return fallback
}

export function candidateApiUrls(
  idInstance: string,
  explicitUrl?: string,
): string[] {
  const urls: string[] = []
  const push = (value?: string) => {
    const trimmed = value?.trim().replace(/\/$/, '')
    if (trimmed && !urls.includes(trimmed)) urls.push(trimmed)
  }

  push(explicitUrl)
  push(import.meta.env.VITE_GREEN_API_URL as string | undefined)

  const prefix = idInstance.slice(0, 4)
  if (/^\d{4}$/.test(prefix)) {
    push(`https://${prefix}.api.green-api.com`)
  }
  if (idInstance.startsWith('3')) {
    push('https://3100.api.green-api.com')
  }
  push('https://api.green-api.com')
  return urls
}

export async function getStateInstance(
  credentials: Credentials,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(instancePath(credentials, 'getStateInstance'), {
    signal,
  })
  const payload = await readJson(response)
  if (!response.ok) {
    throw new Error(errorMessage(payload, `Ошибка ${response.status}`))
  }
  const state =
    payload && typeof payload === 'object'
      ? (payload as { stateInstance?: string }).stateInstance
      : undefined
  if (!state) {
    throw new Error('Не удалось получить состояние инстанса')
  }
  return state
}

export async function resolveCredentials(input: {
  idInstance: string
  apiTokenInstance: string
  apiUrl?: string
}): Promise<{ credentials: Credentials; stateInstance: string }> {
  const idInstance = input.idInstance.trim()
  const apiTokenInstance = input.apiTokenInstance.trim()
  if (!idInstance || !apiTokenInstance) {
    throw new Error('Введите idInstance и apiTokenInstance')
  }

  const urls = candidateApiUrls(idInstance, input.apiUrl)
  let lastError = 'Не удалось подключиться к GREEN-API'

  for (const apiUrl of urls) {
    try {
      const credentials = { idInstance, apiTokenInstance, apiUrl }
      const stateInstance = await getStateInstance(credentials)
      return { credentials, stateInstance }
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError
    }
  }

  throw new Error(
    `${lastError}. Проверьте данные инстанса или укажите API URL из личного кабинета.`,
  )
}

export async function setHttpApiSettings(credentials: Credentials): Promise<void> {
  await fetch(instancePath(credentials, 'setSettings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      webhookUrl: '',
      incomingWebhook: 'yes',
      outgoingWebhook: 'yes',
      outgoingAPIMessageWebhook: 'yes',
      stateWebhook: 'yes',
    }),
  })
}

export async function checkAccount(
  credentials: Credentials,
  phoneNumber: number,
): Promise<{ exist: boolean; chatId: string }> {
  const response = await fetch(instancePath(credentials, 'checkAccount'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber }),
  })
  const payload = (await readJson(response)) as {
    exist?: boolean
    chatId?: string
    reason?: string
    status?: boolean
  } | null

  if (!response.ok) {
    throw new Error(errorMessage(payload, `Ошибка проверки номера (${response.status})`))
  }
  if (payload?.status === false && payload.reason) {
    throw new Error(payload.reason)
  }
  return {
    exist: Boolean(payload?.exist),
    chatId: payload?.chatId ?? '',
  }
}

export async function sendMessage(
  credentials: Credentials,
  chatId: string,
  message: string,
): Promise<string> {
  const response = await fetch(instancePath(credentials, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  })
  const payload = (await readJson(response)) as { idMessage?: string } | null
  if (!response.ok) {
    throw new Error(errorMessage(payload, `Не удалось отправить сообщение (${response.status})`))
  }
  if (!payload?.idMessage) {
    throw new Error('GREEN-API не вернул идентификатор сообщения')
  }
  return payload.idMessage
}

export async function receiveNotification(
  credentials: Credentials,
  signal: AbortSignal,
  receiveTimeout = 20,
): Promise<ReceiveNotificationResponse> {
  const response = await fetch(
    `${instancePath(credentials, 'receiveNotification')}?receiveTimeout=${receiveTimeout}`,
    { signal },
  )
  if (response.status === 204) return null
  const payload = await readJson(response)
  if (!response.ok) {
    throw new Error(errorMessage(payload, `Ошибка получения уведомлений (${response.status})`))
  }
  if (!payload || typeof payload !== 'object') return null
  const record = payload as { receiptId?: number; body?: NotificationBody }
  if (typeof record.receiptId !== 'number') return null
  return { receiptId: record.receiptId, body: record.body ?? {} }
}

export async function deleteNotification(
  credentials: Credentials,
  receiptId: number,
): Promise<void> {
  await fetch(instancePath(credentials, 'deleteNotification', `/${receiptId}`), {
    method: 'DELETE',
  })
}

export function extractText(body: NotificationBody): string {
  const data = body.messageData
  return (
    data?.textMessageData?.textMessage ||
    data?.extendedTextMessageData?.text ||
    ''
  ).trim()
}
