import { KafkaProducer } from '@duelnow/kafka-client'

const producer = new KafkaProducer('exposed-api')

export { producer }
