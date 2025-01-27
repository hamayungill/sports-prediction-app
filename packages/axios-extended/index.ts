import { raiseError } from '@duelnow/utils'
import axios, { AxiosInstance } from 'axios'

import { CustomHeaders, correlationIdMiddleware, logger } from './utils/logger'

const AxiosRequest = (baseUrl: string, headers = {}): AxiosInstance => {
  const axiosService = axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
  // Add a request interceptor
  axiosService.interceptors.request.use(
    (config) => {
      correlationIdMiddleware(config.headers as CustomHeaders, null, () => {
        logger.debug('Axios request intercepted', {
          headers: config.headers,
          url: config.url,
          data: config.data || null,
        })
      })

      return config
    },
    (error) => {
      const { message, name, config, response } = error
      const headers = config.headers || {}
      correlationIdMiddleware(headers, null, () => {
        logger.error('Axios request error intercepted', {
          name,
          message,
          headers,
          response: response || 'No response available',
        })
      })

      // Do something with request error
      return Promise.reject(error)
    },
  )

  // Add a response interceptor
  axiosService.interceptors.response.use(
    (response) => {
      // Any status code that lie within the range of 2xx cause this function to trigger
      /**
       * Internal services format the response using ApiResponse which we are destructuring here and sending to
       * exposed-api to avoid multi layer formatted data
       *
       * if we don't do this exposed-api response would be as given below
       * {"resCode":200,"resData":{"resCode":200,"resData":{"status":"success"}}}
       * */
      const data = response?.data?.resData?.data || response.data
      // Passing response.config.headers so the middleware extracts from the request headers
      // instead of response headers
      correlationIdMiddleware(response.config.headers as CustomHeaders, null, () => {
        logger.debug('Axios response intercepted', {
          status: response.status,
          headers: response.headers,
          payload: data,
        })
      })
      return { ...response, data }
    },
    (error) => {
      // Any status codes that falls outside the range of 2xx cause this function to trigger
      const { name, config, request, response, message } = error
      const headers = config?.headers || {}

      // Handle errors
      if (response) {
        // Server responded with a status other than 2xx
        const { status, data } = response
        const errorStatus = data.resCode || status || 500
        const errorMessage = data.message || message || 'An error occurred'
        const errorData = data.resData.data || data

        correlationIdMiddleware(headers, null, () => {
          logger.error('Axios response error intercepted 1', {
            status: errorStatus,
            headers,
            name,
            message: errorMessage,
            data: errorData,
          })
        })

        raiseError(errorStatus, errorMessage)
        // Return a rejected promise with a custom error message
        return Promise.reject(new Error(errorData))
      } else if (request) {
        // No response received
        const errorMessage = message || 'Network error: No response received'

        correlationIdMiddleware(headers, null, () => {
          logger.error('Axios response error intercepted 2', {
            headers,
            name,
            message: errorMessage,
          })
        })
        raiseError(500, errorMessage)
        return Promise.reject(new Error(errorMessage))
      } else {
        // Other errors
        const errorMessage = message || 'Network error: Other errors'
        correlationIdMiddleware(headers, null, () => {
          logger.error('Axios response error intercepted 3', {
            headers,
            name,
            message: errorMessage,
          })
        })
        raiseError(500, errorMessage)
        return Promise.reject(new Error(errorMessage))
      }
    },
  )
  return axiosService
}

export default AxiosRequest
