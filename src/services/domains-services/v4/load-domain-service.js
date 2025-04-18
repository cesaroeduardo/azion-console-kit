import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeDomainsBaseUrl } from './make-domains-service'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadDomainService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeDomainsBaseUrl()}/${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = ({ body, statusCode }) => {
  if (statusCode !== 200) {
    throw new Error(extractApiError({ body })).message
  }

  const domain = body?.results

  const parsedVariable = {
    id: domain.id,
    name: domain.name,
    alternateDomains: domain.alternate_domains,
    networkMap: domain.network_map,
    lastEditor: domain.last_editor,
    lastModified: domain.last_modified,
    active: domain.active,
    tls: domain.tls,
    protocols: domain.protocols,
    mtls: domain.mtls,
    domains: domain.domains,
    productVersion: domain.product_version
  }

  return {
    body: parsedVariable,
    statusCode
  }
}
