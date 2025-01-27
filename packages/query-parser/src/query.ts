import { PrismaQueryParser } from './utils/queryParsers'
import { Filter, FilterParams, Query, Select, Sort } from './utils/types'

const filterRegex = /([.a-zA-Z_-]*):{1}([$a-z]*):{1}(\[.*?\]|[^,]+)/gm
const defaultWhitelistOps = ['eq', 'gt', 'gte', 'has', 'lt', 'lte', 'in']

const parseFilter = ({
  filter = '',
  whitelist = null,
  whitelistProps = null,
  whitelistOps = defaultWhitelistOps,
}: FilterParams): Filter => {
  const props: Filter = {}
  const regex = new RegExp(filterRegex)
  let match: RegExpExecArray | null

  while ((match = regex.exec(filter)) !== null) {
    const [, prop, op, value] = match
    let isAllowed = false

    if (whitelist) {
      isAllowed = !!whitelist.find(
        ([allowedProp, allowedOp]: [string, string]) => prop === allowedProp && op === allowedOp,
      )
    } else {
      isAllowed = whitelistOps.includes(op) && (!whitelistProps || whitelistProps.includes(prop))
    }
    const regexExp = /[a-z]/gi
    // @ts-expect-error isNaN accepts string param
    const val = isNaN(value) || regexExp.test(value) ? value : Number(value)
    if (isAllowed) {
      if (props[prop]) {
        props[prop].push({ op, value: val })
      } else {
        props[prop] = [{ op, value: val }]
      }
    }
  }
  return props
}

const getDbQuery = ({
  filter,
  whitelist = null,
  whitelistProps = null,
  whitelistOps = defaultWhitelistOps,
}: FilterParams): Query => {
  if (!filter || filter === '') return {}

  const parser = new PrismaQueryParser()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed: any = parseFilter({ filter, whitelist, whitelistProps, whitelistOps })
  Object.keys(parsed).forEach((prop) => parser.add(prop, parsed[prop]))

  return parser.query
}

const getDbQuerySelect = ({ fields }: { fields: string }): Select => {
  return PrismaQueryParser.getSelect(fields)
}

const getDbQuerySort = ({ sort }: { sort: string }): Sort => {
  return PrismaQueryParser.getSort(sort)
}

export default {
  parseFilter,
  getDbQuery,
  getDbQuerySelect,
  getDbQuerySort,
}
