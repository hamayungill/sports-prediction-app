export interface Decoded {
  [key: string]: number
}

export interface Filter {
  [key: string]: { op: string; value: string | number }[]
}

export type FilterParams = {
  filter?: string
  whitelist?: [string, string][] | null
  whitelistProps?: string[] | null
  whitelistOps?: string[]
}

export interface PaginatorParams {
  cursor?: string
  limit?: string
}

export interface Query {
  [key: string]: QueryType
}

export type QueryType =
  | { gt: string }
  | { gte: string }
  | { lt: string }
  | { lte: string }
  | { contains: string; mode: string }
  | { IN: string[] }
  | { equals: string }

export interface Select {
  [key: string]: boolean
}

export interface Sort {
  [key: string]: string
}
