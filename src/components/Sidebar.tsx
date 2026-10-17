import { formatTime, initials } from '../utils/format'
import { useChat } from '../store/ChatContext'

type Props = {
  onNewChat: () => void
}

export function Sidebar({ onNewChat }: Props) {
  const { chats, activeChat, openChat, logout, instanceState } = useChat()

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <div>
          <strong>Чаты</strong>
          <span className={`instance-state is-${instanceState}`}>
            {instanceState || 'online'}
          </span>
        </div>
        <div className="sidebar-actions">
          <button type="button" className="icon-button" onClick={onNewChat} title="Новый чат">
            +
          </button>
          <button type="button" className="icon-button" onClick={logout} title="Выйти">
            ⎋
          </button>
        </div>
      </header>
      <ul className="chat-list">
        {chats.length === 0 ? (
          <li className="empty-hint">Создайте чат по номеру телефона</li>
        ) : (
          chats.map((chat) => {
            const last = chat.messages.at(-1)
            const selected = activeChat?.chatId === chat.chatId
            return (
              <li key={chat.chatId}>
                <button
                  type="button"
                  className={`chat-item${selected ? ' is-active' : ''}`}
                  onClick={() => openChat(chat.chatId)}
                >
                  <span className="avatar">{initials(chat.title)}</span>
                  <span className="chat-item-body">
                    <span className="chat-item-top">
                      <span className="chat-title">{chat.title}</span>
                      {last ? <time>{formatTime(last.timestamp)}</time> : null}
                    </span>
                    <span className="chat-item-bottom">
                      <span className="preview">{last?.text || 'Нет сообщений'}</span>
                      {chat.unread > 0 ? (
                        <span className="unread">{chat.unread}</span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            )
          })
        )}
      </ul>
    </aside>
  )
}
