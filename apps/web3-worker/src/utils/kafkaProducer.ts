import { KafkaProducer } from '@duelnow/kafka-client'

const producer = new KafkaProducer('web3-worker')

export { producer }
