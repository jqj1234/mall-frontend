import store from '@/store'

function parseSseLine (line, onEvent) {
  const trimmed = (line || '').trim()
  if (!trimmed || !trimmed.startsWith('data:')) {
    return
  }

  const dataStr = trimmed.replace(/^data:\s*/, '')
  if (!dataStr || dataStr === '[DONE]') {
    return
  }

  try {
    const data = JSON.parse(dataStr)
    onEvent(data)
  } catch (error) {
    console.error('Failed to parse stream data:', error, 'payload:', dataStr)
  }
}

export async function streamChat ({ message, history }, onEvent) {
  const token =
    store &&
    store.state &&
    store.state.user &&
    store.state.user.user &&
    store.state.user.user.token
      ? store.state.user.user.token
      : ''

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: token } : {})
    },
    body: JSON.stringify({ message, history })
  })

  if (!response.ok) {
    let detail = ''
    try {
      detail = await response.text()
    } catch (error) {
      detail = ''
    }
    throw new Error(detail || `Request failed: ${response.status}`)
  }

  if (!response.body || !response.body.getReader) {
    throw new Error('Streaming is not supported in this browser')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  let isReading = true
  while (isReading) {
    const { done, value } = await reader.read()
    if (done) {
      isReading = false
      continue
    }

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() || ''
    lines.forEach(line => parseSseLine(line, onEvent))
  }

  const tail = decoder.decode()
  if (tail) {
    buffer += tail
  }
  if (buffer.trim()) {
    parseSseLine(buffer, onEvent)
  }
}
