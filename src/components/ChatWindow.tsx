import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useChat } from '../store/ChatContext'
import type { ChatMessage, MessageStatus } from '../types'
import { formatTime, initials } from '../utils/format'

export function ChatWindow() {
  const { activeChat, sendText, openChat } = useChat()
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [activeChat?.messages.length, activeChat?.chatId])

  if (!activeChat) {
    return (
      <section className="chat-empty">
        <div>
          <h2>Выберите чат</h2>
          <p>Или создайте новый по номеру телефона получателя</p>
        </div>
      </section>
    )
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    setDraft('')
    setError('')
    try {
      await sendText(text)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки')
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <section className="chat-window">
      <header className="chat-header">
        <button
          type="button"
          className="icon-button back-button"
          onClick={() => openChat(null)}
          aria-label="К списку чатов"
        >
          ←
        </button>
        <span className="avatar">{initials(activeChat.title)}</span>
        <div>
          <strong>{activeChat.title}</strong>
          {activeChat.phone ? <span>{activeChat.phone}</span> : null}
        </div>
      </header>
      <div className="message-list" ref={listRef}>
        {activeChat.messages.map((message) => (
          <MessageBubble key={message.key} message={message} />
        ))}
      </div>
      {error ? <p className="form-error send-error">{error}</p> : null}
      <form className="composer" onSubmit={onSubmit}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Сообщение"
          rows={1}
          maxLength={4000}
        />
        <button type="submit" className="send-button" disabled={!draft.trim()}>
          ➤
        </button>
      </form>
    </section>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  return (
    <div className={`bubble-row is-${message.direction}`}>
      <div className={`bubble is-${message.direction}`}>
        <p>{message.text}</p>
        <span className="meta">
          {formatTime(message.timestamp)}
          {message.direction === 'out' ? (
            <StatusMark status={message.status} />
          ) : null}
        </span>
      </div>
    </div>
  )
}

function StatusMark({ status }: { status: MessageStatus }) {
  const label =
    status === 'sending'
      ? '…'
      : status === 'failed'
        ? '!'
        : status === 'read'
          ? '✓✓'
          : status === 'delivered'
            ? '✓✓'
            : '✓'
  return (
    <span className={`status is-${status}`} aria-label={status}>
      {label}
    </span>
  )
}
