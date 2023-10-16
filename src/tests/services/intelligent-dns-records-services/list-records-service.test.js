import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listRecordsService } from '@/services/intelligent-dns-records-services'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  dnsRecordMock: {
    record_id: 1239875,
    entry: 'entry A',
    record_type: 'record Type AAA',
    answers_list: ['answer 1', 'answer 1'],
    ttl: 8000,
    policy: 'zero thrust',
    description: 'record description A'
  },
  dnsRecordMissingDataMock: {
    answers_list: [],
    description: '',
    record_id: 7865768,
    entry: 'entry B',
    record_type: 'record Type AAA',
    ttl: 8000,
    policy: 'zero thrust'
  }
}

const makeSut = () => {
  const sut = listRecordsService

  return {
    sut
  }
}

describe('IntelligentDnsRecordsServices', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: [] }
    })
    const dnsRecordIdMock = 1
    const pageMock = 10
    const { sut } = makeSut()

    await sut({
      page: pageMock,
      id: dnsRecordIdMock
    })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `intelligent_dns/${dnsRecordIdMock}/records?page=${pageMock}`,
      method: 'GET'
    })
  })

  it('should parsed correctly each dns record', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { results: { records: [fixtures.dnsRecordMock, fixtures.dnsRecordMissingDataMock] } }
    })
    const recordIdStub = 1
    const pageStub = 7
    const { sut } = makeSut()

    const result = await sut({
      id: recordIdStub,
      page: pageStub
    })

    expect(result).toEqual([
      {
        id: fixtures.dnsRecordMock.record_id,
        name: fixtures.dnsRecordMock.entry,
        type: fixtures.dnsRecordMock.record_type,
        value: `${fixtures.dnsRecordMock.answers_list.at(
          0
        )},${fixtures.dnsRecordMock.answers_list.at(1)}`,
        ttl: fixtures.dnsRecordMock.ttl,
        policy: fixtures.dnsRecordMock.policy,
        description: fixtures.dnsRecordMock.description
      },
      {
        id: fixtures.dnsRecordMissingDataMock.record_id,
        name: fixtures.dnsRecordMissingDataMock.entry,
        type: fixtures.dnsRecordMissingDataMock.record_type,
        value: '',
        ttl: fixtures.dnsRecordMissingDataMock.ttl,
        policy: fixtures.dnsRecordMissingDataMock.policy,
        description: '-'
      }
    ])
  })
})
