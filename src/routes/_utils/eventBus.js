import EventEmitter from 'events-light'

export const eventBus = new EventEmitter()

if (process.browser) {
  window.__eventBus = eventBus
}

export function on (eventName, component, method) {
  const callback = method.bind(component)
  eventBus.on(eventName, callback)
  component.on('destroy', () => {
    eventBus.removeListener(eventName, callback)
  })
}

export const emit = eventBus.emit.bind(eventBus)
