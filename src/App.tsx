import { LoginScreen } from './components/LoginScreen'
import { Messenger } from './components/Messenger'
import { ChatProvider, useChat } from './store/ChatContext'
import { Toaster } from 'react-hot-toast'

function Shell() {
  const { credentials } = useChat()
  return credentials ? <Messenger /> : <LoginScreen />
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <ChatProvider>
        <Shell />
      </ChatProvider>
    </>
  )
}
