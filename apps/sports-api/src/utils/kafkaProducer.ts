import { KafkaProducer } from '@duelnow/kafka-client'

const producer = new KafkaProducer('sports-api')

export { producer }
