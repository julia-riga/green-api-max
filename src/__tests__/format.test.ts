import { describe, it, expect } from 'vitest'
import { normalizePhone, formatPhone, isValidPhone, formatTime } from '../utils/format'

describe('normalizePhone', () => {
  it('должен преобразовать номер с "8" в "7"', () => {
    expect(normalizePhone('89991234567')).toBe('79991234567')
  })

  it('должен оставить номер без изменений, если он не начинается с 8', () => {
    expect(normalizePhone('79991234567')).toBe('79991234567')
  })

  it('должен возвращать исходный номер, если он слишком короткий', () => {
    expect(normalizePhone('123')).toBe('123')
  })

  it('должен удалить все нецифровые символы', () => {
    expect(normalizePhone('+8 (999) 123-45-67')).toBe('79991234567')
  })

  it('должен обрабатывать белорусские номера', () => {
    // Белорусский номер: +375 29 123-45-67 → 375291234567 (12 цифр)
    expect(normalizePhone('375291234567')).toBe('375291234567')
  })
})

describe('formatPhone', () => {
  it('должен форматировать российский номер с +"7"', () => {
    expect(formatPhone('89991234567')).toBe('+7 999 123-45-67')
  })

  it('должен возвращать "+digits" для непривязанных номеров', () => {
    expect(formatPhone('12345678901')).toBe('+12345678901')
  })

  it('должен обрабатывать белорусские номера', () => {
    // Белорусский: +375 29 123-45-67 (12 цифр)
    expect(formatPhone('375291234567')).toBe('+375 29 123-45-67')
  })
})

describe('isValidPhone', () => {
  it('должен вернуть true для корректного российского номера', () => {
    expect(isValidPhone('89991234567')).toBe(true)
  })

  it('должен вернуть false для слишком короткого номера', () => {
    expect(isValidPhone('123')).toBe(false)
  })

  it('должен вернуть true для корректного белорусского номера (12 цифр)', () => {
    // Белорусский: +375 29 123-45-67 → 375291234567 (12 цифр)
    expect(isValidPhone('375291234567')).toBe(true)
  })

  it('должен вернуть false для пустой строки', () => {
    expect(isValidPhone('')).toBe(false)
  })
})

describe('formatTime', () => {
  it('должен форматировать timestamp в "HH:MM"', () => {
    const result = formatTime(Date.now())
    // Результат должен быть строкой в формате "HH:MM" (например, "14:30")
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })

  it('должен корректно обрабатывать старые timestamps', () => {
    const result = formatTime(1609459200000) // Пример: 2021-01-01T00:00:00Z
    expect(result).toMatch(/^\d{2}:\d{2}$/)
  })
})
