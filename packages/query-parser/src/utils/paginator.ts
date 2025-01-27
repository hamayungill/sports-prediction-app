import { PaginatorParams } from '../utils/types'

export default class Paginator {
  public cursor?: string | null
  public limit?: number = 25
  public decoded = { skip: 0 }

  public constructor(params: PaginatorParams, maxLimit = 100) {
    this.limit = parseInt(params.limit || '')
    if (isNaN(this.limit) || this.limit < 1) this.limit = 25
    this.limit = this.limit > maxLimit ? maxLimit : this.limit

    this.cursor = params.cursor || null

    if (this.cursor && this.cursor !== '') {
      const buff = Buffer.from(this.cursor, 'base64')
      const decoded = buff.toString('ascii')

      try {
        this.decoded = JSON.parse(decoded)
      } catch (e) {
        this.cursor = null
      }
    } else {
      this.cursor = null
    }
  }

  public getNextCursor(count: number): string | null {
    this.limit = this.limit || 25
    if (!count) return null
    if (Math.ceil(count / (this.decoded.skip + this.limit)) > 1) {
      const buff = Buffer.from(JSON.stringify({ skip: this.decoded.skip + this.limit }))
      return buff.toString('base64')
    }
    return null
  }
}
