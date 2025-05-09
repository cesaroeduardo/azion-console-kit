import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listAccountsService } from '@/services/accounts-management-services/list-accounts-service'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  accountSample: {
    id: 123,
    name: 'teste',
    is_active: true,
    company_name: 'teste'
  },
  inactiveAccountSample: {
    id: 123,
    name: 'teste',
    is_active: false,
    company_name: 'teste'
  }
}

const makeSut = () => {
  const sut = listAccountsService

  return { sut }
}

describe('AccountsManagementServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { count: 0, results: [] }
    })

    const { sut } = makeSut()
    await sut({ account_type: 'reseller' })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `iam/accounts?account_type=reseller&ordering=name&page=1&page_size=10&fields=undefined&search=`,
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        count: 1,
        results: [fixtures.accountSample]
      }
    })

    const { sut } = makeSut()
    const result = await sut({ account_type: 'reseller' })
    expect(result.body).toEqual([
      {
        id: fixtures.accountSample.id,
        name: fixtures.accountSample.name,
        company: fixtures.accountSample.company_name,
        status: {
          content: 'Active',
          severity: 'success'
        }
      }
    ])
  })

  it('should parse correctly inactive each returned item', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        count: 1,
        results: [fixtures.inactiveAccountSample]
      }
    })

    const { sut } = makeSut()
    const result = await sut({ account_type: 'reseller' })

    expect(result.body).toEqual([
      {
        id: fixtures.accountSample.id,
        name: fixtures.accountSample.name,
        company: fixtures.accountSample.company_name,
        status: {
          content: 'Inactive',
          severity: 'error'
        }
      }
    ])
  })
})
