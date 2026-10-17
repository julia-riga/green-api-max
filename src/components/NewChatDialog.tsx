import { useState, type FormEvent } from 'react'
import { useChat } from '../store/ChatContext'
import { isValidPhone } from '../utils/format'

type Props = {
  onClose: () => void
}

export function NewChatDialog({ onClose }: Props) {
  const { createChat } = useChat()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!isValidPhone(phone)) {
      setError('Введите номер в международном формате, например 79991234567')
      return
    }
    setPending(true)
    try {
      await createChat(phone)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать чат')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <form
        className="modal"
        onClick={(event) => event.stopPropagation()}
        onSubmit={onSubmit}
      >
        <h2>Новый чат</h2>
        <p>Введите номер телефона получателя в MAX</p>
        <input
          autoFocus
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="79991234567"
          inputMode="tel"
        />
        {error ? <p className="form-error">{error}</p> : null}
        <div className="modal-actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="primary-button" disabled={pending}>
            {pending ? 'Проверка…' : 'Создать'}
          </button>
        </div>
      </form>
    </div>
  )
}
