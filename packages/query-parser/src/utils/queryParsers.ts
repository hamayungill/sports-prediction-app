import { Query, QueryType, Select, Sort } from '../utils/types'

const sortRegex = /([a-zA-Z_-]*):{1}(\[.*?\]|[^,]+)/gm
const filterOpInRegex = /(^.*\[|\].*$)/g

class QueryParser {
  static strToArray(str: string): string[] {
    if (typeof str !== 'string' || str === '') return []

    return [...str.replace(filterOpInRegex, '').split(',')]
  }
}

class PrismaQueryParser extends QueryParser {
  public query: Query

  constructor() {
    super()
    this.query = {}
  }

  add(prop: string, data: [{ op: string; value: string }]): void {
    data.forEach((curr) => {
      if (this.query[prop]) {
        Object.assign(
          this.query[prop],
          this.getPropQuery({
            op: curr.op,
            value: curr.value,
          }),
        )
      } else {
        this.query[prop] = this.getPropQuery({
          op: curr.op,
          value: curr.value,
        })
      }
    })
  }

  getPropQuery({ op, value }: { op: string; value: string }): QueryType {
    switch (op) {
      case 'gt':
        return { gt: value }
      case 'gte':
        return { gte: value }
      case 'lt':
        return { lt: value }
      case 'lte':
        return { lte: value }
      case 'has':
        return { contains: value, mode: 'insensitive' }
      case 'in':
        return { IN: QueryParser.strToArray(value) }
      default:
        return { equals: value }
    }
  }

  static getSelect(fields: string): Select {
    if (typeof fields !== 'string' || fields === '') return {}

    const fieldsObject: Select = {}
    fields.split(',').forEach(function (field) {
      fieldsObject[field] = true
    })

    return fieldsObject
  }

  static getSort(sort: string): Sort {
    if (typeof sort !== 'string' || sort === '' || !RegExp('^[A-Za-z_\\-,:]+$', 'g').test(sort)) return {}

    const parts: Sort = {}
    const regex = new RegExp(sortRegex)
    let match: RegExpExecArray | null

    while ((match = regex.exec(sort)) != null) {
      const [, prop, direction] = match
      parts[prop] = direction || ''
    }

    return parts
  }
}

export { PrismaQueryParser, QueryParser }
