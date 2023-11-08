import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeResetPasswordBaseUrl } from './make-reset-password-base-url'
import * as Errors from '@/services/axios/errors'

export const resetPasswordService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeResetPasswordBaseUrl()}/new`,
    method: 'POST',
    body: adapt(payload)
  })
  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    password: payload.password,
    uidb64: payload.uidb64,
    token: payload.token
  }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 201:
      return 'Password reset successfully'
    case 400:
      const apiError = extractApiError(httpResponse)
      throw new Error(apiError)
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}

/**
 * @param {Object} errorSchema - The error schema.
 * @param {string} key - The error key of error schema.
 * @returns {string|undefined} The result message based on the status code.
 */
const extractErrorKey = (errorSchema, key) => {
  return errorSchema[key]?.[0]
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @returns {string} The result message based on the status code.
 */
const extractApiError = (httpResponse) => {
  const alreadyUsedKeyError = extractErrorKey(httpResponse.body, 'non_field_errors')

  const errorMessages = [alreadyUsedKeyError]
  const errorMessage = errorMessages.find((error) => !!error)
  return errorMessage
}
