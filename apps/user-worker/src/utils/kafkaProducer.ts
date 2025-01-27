import { KafkaProducer } from '@duelnow/kafka-client'

const producer = new KafkaProducer('user-worker')

export { producer }
