import { KafkaProducer } from '@duelnow/kafka-client'

const producer = new KafkaProducer('event-worker')

export { producer }
