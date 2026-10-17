import { useState } from 'react'
import { useChat } from '../store/ChatContext'
import { ChatWindow } from './ChatWindow'
import { NewChatDialog } from './NewChatDialog'
import { Sidebar } from './Sidebar'

export function Messenger() {
  const { activeChat, sidebarOpen } = useChat()
  const [newChatOpen, setNewChatOpen] = useState(false)
  const showSidebar = sidebarOpen || !activeChat

  return (
    <div className={`messenger${showSidebar ? '' : ' chat-focus'}`}>
      <Sidebar onNewChat={() => setNewChatOpen(true)} />
      <ChatWindow />
      {newChatOpen ? <NewChatDialog onClose={() => setNewChatOpen(false)} /> : null}
    </div>
  )
}
