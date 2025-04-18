import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { listRulesEngineServiceAll } from '@/services/edge-application-rules-engine-services/v4'
import { describe, expect, it, vi } from 'vitest'

const fixtures = {
  rulesEngine: {
    id: 0,
    name: 'string',
    phase: 'default',
    active: true,
    behaviors: [
      {
        name: 'deny',
        argument: 0
      }
    ],
    criteria: [
      [
        {
          argument: 0,
          variable: '${arg_<name>}',
          conditional: 'if',
          operator: 'is_equal'
        }
      ]
    ],
    description: 'string',
    order: 0
  }
}

const makeSut = () => {
  const sut = listRulesEngineServiceAll

  return { sut }
}

describe('EdgeApplicationRulesEngineServicesV4', () => {
  it('should call api with correct params', async () => {
    const requestSpy = vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: { count: 0, results: [] }
    })

    const edgeApplicationId = 123

    const { sut } = makeSut()
    const version = 'v4'
    await sut({ id: edgeApplicationId })

    expect(requestSpy).toHaveBeenCalledWith({
      url: `${version}/edge_application/applications/${edgeApplicationId}/rules?ordering=&page=1&page_size=100&fields=&search=`,
      method: 'GET'
    })
  })

  it('should parse correctly each returned item', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        count: 1,
        results: [fixtures.rulesEngine]
      }
    })

    const edgeApplicationId = 123

    const { sut } = makeSut()
    const result = await sut({ id: edgeApplicationId })

    expect(result).toEqual({
      body: [
        {
          id: fixtures.rulesEngine.id,
          name: fixtures.rulesEngine.name,
          phase: {
            content: 'Default',
            outlined: true,
            severity: 'info'
          },
          behaviors: fixtures.rulesEngine.behaviors,
          criteria: fixtures.rulesEngine.criteria,
          status: {
            content: 'Active',
            severity: 'success'
          },
          position: {
            altered: false,
            immutableValue: 0,
            max: 0,
            min: 0,
            value: 0
          },
          description: 'string'
        }
      ],
      count: 1
    })
  })

  it('should return empty array when there is no rules engine', async () => {
    vi.spyOn(AxiosHttpClientAdapter, 'request').mockResolvedValueOnce({
      statusCode: 200,
      body: {
        count: 0,
        results: []
      }
    })

    const edgeApplicationId = 123

    const { sut } = makeSut()
    const result = await sut({ id: edgeApplicationId })
    expect(result).toHaveLength(0)
  })
})
