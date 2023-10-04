import * as PersonalTokensService from '@/services/personal-tokens-services'

/** @type {import('vue-router').RouteRecordRaw} */
export const personalTokensRoutes = {
  path: '/personal-tokens',
  name: 'personal-tokens',
  children: [
    {
      path: '',
      name: 'list-personal-tokens',
      component: () => import('@views/PersonalTokens/ListView.vue'),
      props: {
        listPersonalTokensService: PersonalTokensService.listPersonalTokens,
        deletePersonalTokenService: PersonalTokensService.deletePersonalToken
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Personal Tokens',
            to: '/personal-tokens'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-personal-token',
      component: () => import('@views/PersonalTokens/CreateView.vue'),
      props: {
        createPersonalTokenService: PersonalTokensService.createPersonalToken
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Personal Tokens',
            to: '/personal-tokens'
          },
          {
            label: 'Create Personal Token',
            to: '/personal-tokens/create'
          }
        ]
      }
    }
  ]
}