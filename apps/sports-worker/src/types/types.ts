interface KafkaMessageValue {
  schema_name: string
  sport_name: string
  sport_id?: number
  game_id?: number
  table: string
  data: any // eslint-disable-line @typescript-eslint/no-explicit-any
  //This is added because we can't define the schema received from the Rapid API, as we are storing the whole JSON in this field.
}

export type { KafkaMessageValue }
