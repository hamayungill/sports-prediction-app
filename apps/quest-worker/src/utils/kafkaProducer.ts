import { KafkaProducer } from '@duelnow/kafka-client'

const producer = new KafkaProducer('quest-worker')

export { producer }
