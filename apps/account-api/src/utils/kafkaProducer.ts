import { KafkaProducer } from '@duelnow/kafka-client'

const producer = new KafkaProducer('account-api')

export { producer }
