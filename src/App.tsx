import { LoginScreen } from './components/LoginScreen'
import { Messenger } from './components/Messenger'
import { ChatProvider, useChat } from './store/ChatContext'

function Shell() {
  const { credentials } = useChat()
  return credentials ? <Messenger /> : <LoginScreen />
}

export default function App() {
  return (
    <ChatProvider>
      <Shell />
    </ChatProvider>
  )
}
