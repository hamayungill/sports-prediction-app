import { KafkaProducer } from '@duelnow/kafka-client'

const producer = new KafkaProducer('cron-worker')

export { producer }
