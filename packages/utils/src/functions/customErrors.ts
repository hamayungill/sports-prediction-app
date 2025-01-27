// throw this error when the worker should be stopped
export class FatalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FatalError'
    Object.setPrototypeOf(this, FatalError.prototype)
  }
}

// throw this error when message needs to be sent to dead letter queue
export class NonRetriableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NonRetriableError'
    Object.setPrototypeOf(this, NonRetriableError.prototype)
  }
}

// throw this error when message needs to be sent to retry topic
export class RetriableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RetriableError'
    Object.setPrototypeOf(this, RetriableError.prototype)
  }
}
