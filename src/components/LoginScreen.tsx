import { useState, type FormEvent } from 'react'
import { resolveCredentials } from '../api/greenApi'
import { useChat } from '../store/ChatContext'

export function LoginScreen() {
  const { login } = useChat()
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [showApiUrl, setShowApiUrl] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setPending(true)
    try {
      const { credentials, stateInstance } = await resolveCredentials({
        idInstance,
        apiTokenInstance,
        apiUrl: showApiUrl ? apiUrl : undefined,
      })
      if (stateInstance === 'notAuthorized') {
        throw new Error(
          'Инстанс не авторизован в MAX. Авторизуйте его в личном кабинете GREEN-API.',
        )
      }
      if (stateInstance === 'blocked') {
        throw new Error('Аккаунт MAX заблокирован.')
      }
      await login(credentials, stateInstance)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти')
      setShowApiUrl(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          <Logo />
          <h1>MAX</h1>
        </div>
        <p className="auth-lead">
          Войдите с данными инстанса из{' '}
          <a href="https://console.green-api.com/" target="_blank" rel="noreferrer">
            личного кабинета GREEN-API
          </a>
        </p>
        <form onSubmit={onSubmit} className="auth-form">
          <label>
            idInstance
            <input
              value={idInstance}
              onChange={(event) => setIdInstance(event.target.value)}
              placeholder="3100..."
              autoComplete="username"
              required
            />
          </label>
          <label>
            apiTokenInstance
            <input
              value={apiTokenInstance}
              onChange={(event) => setApiTokenInstance(event.target.value)}
              placeholder="Токен инстанса"
              autoComplete="current-password"
              required
            />
          </label>
          {showApiUrl ? (
            <label>
              API URL
              <input
                value={apiUrl}
                onChange={(event) => setApiUrl(event.target.value)}
                placeholder="https://3100.api.green-api.com"
              />
            </label>
          ) : (
            <button
              type="button"
              className="link-button"
              onClick={() => setShowApiUrl(true)}
            >
              Указать API URL вручную
            </button>
          )}
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? 'Подключение…' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Logo() {
  return (
    <svg className="brand-logo" viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="max-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c5cff" />
          <stop offset="100%" stopColor="#3d9eff" />
        </linearGradient>
      </defs>
      <path
        fill="url(#max-grad)"
        d="M24 4C13.5 4 5 12.2 5 22.3c0 5.7 2.8 10.8 7.3 14.2l-1.4 8.1 8.2-3.8c1.6.4 3.2.6 4.9.6 10.5 0 19-8.2 19-18.3S34.5 4 24 4z"
      />
    </svg>
  )
}
