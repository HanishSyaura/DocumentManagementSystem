let state = {
  active: false,
  percent: null,
  loaded: 0,
  total: 0,
  label: ''
}

const listeners = new Set()
let activeCount = 0
let hideTimer = null

const emit = () => {
  for (const fn of listeners) fn(state)
}

export const getUploadProgress = () => state

export const subscribeUploadProgress = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const startUploadProgress = (label) => {
  activeCount += 1
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  state = {
    active: true,
    percent: 0,
    loaded: 0,
    total: 0,
    label: label || 'Uploading...'
  }
  emit()
}

export const updateUploadProgress = (loaded, total) => {
  const safeLoaded = typeof loaded === 'number' && loaded >= 0 ? loaded : 0
  const safeTotal = typeof total === 'number' && total > 0 ? total : 0
  const percent = safeTotal ? Math.min(100, Math.floor((safeLoaded / safeTotal) * 100)) : null

  state = {
    ...state,
    active: true,
    loaded: safeLoaded,
    total: safeTotal,
    percent
  }
  emit()
}

export const finishUploadProgress = () => {
  activeCount = Math.max(0, activeCount - 1)
  state = { ...state, active: true, percent: 100 }
  emit()

  if (activeCount === 0) {
    hideTimer = setTimeout(() => {
      state = { ...state, active: false }
      emit()
      hideTimer = null
    }, 600)
  }
}

export const failUploadProgress = () => {
  activeCount = Math.max(0, activeCount - 1)
  if (activeCount === 0) {
    if (hideTimer) {
      clearTimeout(hideTimer)
      hideTimer = null
    }
    state = { ...state, active: false }
    emit()
  }
}
