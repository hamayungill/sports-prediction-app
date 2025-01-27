/* eslint-disable @typescript-eslint/no-explicit-any */
import { delay } from '@duelnow/utils'
import { KafkaMessage, Producer, RecordMetadata } from 'kafkajs'

import { KafkaProducer } from './producer'
import { IKafkaMessage, IKafkaMessageHeaders } from './utils'

jest.mock('@duelnow/utils', () => ({
  delay: jest.fn(),
  isLocal: jest.fn(),
}))

jest.mock('dotenv-extended', () => ({
  load: jest.fn(),
}))

jest.mock('@duelnow/logger', () => ({
  Logger: jest.fn(),
  correlationIdMiddleware: jest.fn((_headers, fn) => fn()),
  getLogger: jest.fn(),
}))

jest.mock('./utils/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), debug: jest.fn(), warn: jest.fn() },
  correlationIdMiddleware: jest.fn(),
}))

const mProducer = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  send: jest.fn(),
}

jest.mock('kafkajs', () => {
  return {
    Kafka: jest.fn().mockImplementation(() => ({
      producer: jest.fn(() => mProducer as unknown as Producer),
    })),
    Partitioners: { DefaultPartitioner: jest.fn() },
  }
})

describe('KafkaProducer', () => {
  let kafkaProducer: KafkaProducer

  const clientId = 'testClient'
  const topic = 'test-topic'
  const message: IKafkaMessage = {
    key: 'test-key',
    value: {
      eventName: 'value',
      data: {
        data1: 'data1',
      },
    },
  }
  const metadata = {
    'correlation-id': 'test-correlation-id',
    caller: 'test-caller',
    'caller-id': 'test-caller-id',
    'x-forwarded-for': '192.168.1.1',
    'user-agent': 'test-agent',
  }
  const headers: IKafkaMessageHeaders = {
    correlationId: metadata['correlation-id'],
    caller: metadata.caller,
    callerId: metadata['caller-id'],
    ip: metadata['x-forwarded-for'],
    ua: metadata['user-agent'],
  }
  const recordMetadata: RecordMetadata[] = [{ partition: 0, offset: '0', topicName: 'test-topic', errorCode: 0 }]

  beforeEach(() => {
    jest.clearAllMocks()
    kafkaProducer = new KafkaProducer(clientId)
  })

  it('should send a message successfully', async () => {
    mProducer.send.mockResolvedValueOnce(recordMetadata)

    const result = await kafkaProducer.sendMessage(topic, message, metadata)

    expect(mProducer.connect).toHaveBeenCalledTimes(1)
    expect(mProducer.send).toHaveBeenCalledWith({
      topic,
      messages: [
        {
          key: message.key,
          value: JSON.stringify(message.value),
          headers: expect.objectContaining(headers),
        },
      ],
    })
    expect(mProducer.disconnect).toHaveBeenCalledTimes(1)
    expect(result).toEqual(recordMetadata)
  })

  it('should retry sending a message on failure and succeed', async () => {
    mProducer.send.mockRejectedValueOnce(new Error('send error')).mockResolvedValueOnce(recordMetadata)

    const result = await kafkaProducer.sendMessage(topic, message, metadata)

    expect(mProducer.connect).toHaveBeenCalledTimes(2)
    expect(mProducer.send).toHaveBeenCalledTimes(2) // 1 failed, 1 successful
    expect(delay).toHaveBeenCalledTimes(1)
    expect(result).toEqual(recordMetadata)
  })

  it('should throw an error after exhausting retries', async () => {
    mProducer.send.mockRejectedValue(new Error('send error'))

    await expect(kafkaProducer.sendMessage(topic, message, metadata, 2, 10)).rejects.toThrow('send error')

    expect(mProducer.connect).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
    expect(mProducer.send).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
    expect(delay).toHaveBeenCalledTimes(2)
  })

  it('should get client ID', () => {
    const clientId = kafkaProducer.getClientId()
    expect(clientId).toBe('testClient')
  })

  it('should correctly format headers', () => {
    const formattedHeaders = (kafkaProducer as any).getHeaders(metadata)
    expect(formattedHeaders.correlationId).toBe(headers.correlationId)
    expect(formattedHeaders.caller).toBe(headers.caller)
    expect(formattedHeaders.callerId).toBe(headers.callerId)
    expect(formattedHeaders.ip).toBe(headers.ip)
    expect(formattedHeaders.ua).toBe(headers.ua)
  })

  it('should handle missing optional headers correctly', () => {
    const minimalMetadata = {
      'correlation-id': 'test-correlation-id',
    }
    const formattedHeaders = (kafkaProducer as any).getHeaders(minimalMetadata)
    expect(formattedHeaders.correlationId).toBe(minimalMetadata['correlation-id'])
    expect(formattedHeaders.caller).toBe('')
    expect(formattedHeaders.callerId).toBe('')
    expect(formattedHeaders.ip).toBe('')
    expect(formattedHeaders.ua).toBe('')
  })

  it('should handle complex x-forwarded-for correctly', () => {
    const complexMetadata = {
      ...metadata,
      'x-forwarded-for': '203.0.113.1, 192.168.1.1',
    }
    const formattedHeaders = (kafkaProducer as any).getHeaders(complexMetadata)
    expect(formattedHeaders.ip).toBe('203.0.113.1')
  })

  it('should include utm and referer in headers if provided', () => {
    const utmMetadata = {
      ...metadata,
      utm: { source: 'google', medium: 'cpc' },
      referer: 'https://example.com',
      requestMethod: 'POST',
      requestPath: '/api/resource',
    }

    const formattedHeaders = (kafkaProducer as any).getHeaders(utmMetadata)

    expect(formattedHeaders.utm).toEqual(JSON.stringify(utmMetadata.utm))
    expect(formattedHeaders.referer).toBe(utmMetadata.referer)
    expect(formattedHeaders.requestMethod).toBe(utmMetadata.requestMethod)
    expect(formattedHeaders.requestPath).toBe(utmMetadata.requestPath)
  })

  it('should send a KafkaMessage successfully', async () => {
    const kafkaMessage = {
      key: Buffer.from('test-key'),
      value: Buffer.from(JSON.stringify({ eventName: 'value' })),
      headers: headers as any, // Cast to `any` to align with the mock structure
    }

    mProducer.send.mockResolvedValueOnce(recordMetadata)

    const result = await kafkaProducer.sendAsKafkaMessage(topic, kafkaMessage as KafkaMessage)

    expect(mProducer.connect).toHaveBeenCalledTimes(1)
    expect(mProducer.send).toHaveBeenCalledWith({
      topic,
      messages: [
        {
          key: kafkaMessage.key,
          value: kafkaMessage.value,
          headers: kafkaMessage.headers,
        },
      ],
    })
    expect(mProducer.disconnect).toHaveBeenCalledTimes(1)
    expect(result).toEqual(recordMetadata)
  })

  it('should retry sending a KafkaMessage on failure and succeed', async () => {
    const kafkaMessage = {
      key: Buffer.from('test-key'),
      value: Buffer.from(JSON.stringify({ eventName: 'value' })),
      headers: headers as any, // Cast to `any` to align with the mock structure
    }

    mProducer.send.mockRejectedValueOnce(new Error('send error')).mockResolvedValueOnce(recordMetadata)

    const result = await kafkaProducer.sendAsKafkaMessage(topic, kafkaMessage as KafkaMessage)

    expect(mProducer.connect).toHaveBeenCalledTimes(2)
    expect(mProducer.send).toHaveBeenCalledTimes(2) // 1 failed, 1 successful
    expect(delay).toHaveBeenCalledTimes(1)
    expect(result).toEqual(recordMetadata)
  })

  it('should throw an error after exhausting retries for KafkaMessage', async () => {
    const kafkaMessage = {
      key: Buffer.from('test-key'),
      value: Buffer.from(JSON.stringify({ eventName: 'value' })),
      headers: headers as any, // Cast to `any` to align with the mock structure
    }

    mProducer.send.mockRejectedValue(new Error('send error'))

    await expect(kafkaProducer.sendAsKafkaMessage(topic, kafkaMessage as KafkaMessage, 2, 10)).rejects.toThrow(
      'send error',
    )

    expect(mProducer.connect).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
    expect(mProducer.send).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
    expect(delay).toHaveBeenCalledTimes(2)
  })
})
