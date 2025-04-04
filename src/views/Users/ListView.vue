<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'

  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, ref, inject } from 'vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    listUsersService: {
      required: true,
      type: Function
    },
    deleteUsersService: {
      required: true,
      type: Function
    },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const handleTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'User'
    })
  }

  const handleTrackEditEvent = () => {
    tracker.product.clickToEdit({
      productName: 'User'
    })
  }

  const hasContentToList = ref(true)
  const pageTitle = 'Users'
  const actions = [
    {
      type: 'delete',
      title: 'user',
      icon: 'pi pi-trash',
      service: props.deleteUsersService
    }
  ]

  const USERS_API_FIELDS = [
    'id',
    'first_name',
    'last_name',
    'email',
    'teams',
    'two_factor_enabled',
    'is_active',
    'is_account_owner'
  ]

  const getColumns = computed(() => [
    {
      field: 'firstName',
      header: 'First Name',
      sortField: 'first_name'
    },
    {
      field: 'lastName',
      header: 'Last Name',
      sortField: 'last_name'
    },
    {
      field: 'email',
      header: 'Email Address'
    },
    {
      field: 'teams',
      header: 'Teams',
      disableSort: true
    },
    {
      field: 'mfa',
      header: 'MFA',
      type: 'component',
      disableSort: true,
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      }
    },
    {
      field: 'status',
      header: 'Status',
      disableSort: true,
      filterPath: 'status.content',
      type: 'component',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      }
    },
    {
      field: 'owner',
      header: 'Account Owner',
      filterPath: 'owner.content',
      type: 'component',
      disableSort: true,
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
      }
    }
  ])

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="pageTitle"
        data-testid="users__list-view__page-heading"
      />
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        :listService="listUsersService"
        :columns="getColumns"
        addButtonLabel="User"
        createPagePath="users/create"
        editPagePath="users/edit"
        @on-load-data="handleLoadData"
        @on-before-go-to-add-page="handleTrackEvent"
        @on-before-go-to-edit="handleTrackEditEvent"
        emptyListMessage="No users found."
        :actions="actions"
        :defaultOrderingFieldName="'name'"
        :apiFields="USERS_API_FIELDS"
      />
      <EmptyResultsBlock
        v-else
        title="No user has been created"
        description=" Click the button below to create your first user."
        createButtonLabel="User"
        createPagePath="users/create"
        @click-to-create="handleTrackEvent"
        :documentationService="documentationService"
        data-testid="users__list-view__empty-results-block"
      >
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>
