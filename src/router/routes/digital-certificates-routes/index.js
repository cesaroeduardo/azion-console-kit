import * as DigitalCertificatesServiceV4 from '@/services/digital-certificates-services/v4'

import * as Helpers from '@/helpers'

/** @type {import('vue-router').RouteRecordRaw} */
export const digitalCertificatesRoutes = {
  path: '/digital-certificates',
  name: 'digital-certificates',
  children: [
    {
      path: '',
      name: 'list-digital-certificates',
      component: () => import('@views/DigitalCertificates/ListView.vue'),
      props: {
        listDigitalCertificatesService: DigitalCertificatesServiceV4.listDigitalCertificatesService,
        deleteDigitalCertificatesService:
          DigitalCertificatesServiceV4.deleteDigitalCertificatesService,
        documentationService: Helpers.documentationCatalog.digitalCertificates
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Digital Certificates',
            to: '/digital-certificates'
          }
        ]
      }
    },
    {
      path: 'create',
      name: 'create-digital-certificates',
      component: () => import('@views/DigitalCertificates/CreateView.vue'),
      props: {
        createDigitalCertificatesCSRService:
          DigitalCertificatesServiceV4.createDigitalCertificatesCSRService,
        createDigitalCertificatesService:
          DigitalCertificatesServiceV4.createDigitalCertificatesService
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Digital Certificates',
            to: '/digital-certificates'
          },
          {
            label: 'Create Digital Certificate',
            to: '/digital-certificates/create'
          }
        ]
      }
    },
    {
      path: 'edit/:id',
      name: 'edit-digital-certificates',
      component: () => import('@views/DigitalCertificates/EditView.vue'),
      props: {
        editDigitalCertificateService: DigitalCertificatesServiceV4.editDigitalCertificateService,
        loadDigitalCertificateService: DigitalCertificatesServiceV4.loadDigitalCertificateService,
        updatedRedirect: 'list-digital-certificates',
        clipboardWrite: Helpers.clipboardWrite,
        documentationService: Helpers.documentationGuideProducts.generateLetsEncryptCertificate
      },
      meta: {
        breadCrumbs: [
          {
            label: 'Digital Certificates',
            to: '/digital-certificates'
          },
          {
            label: 'Edit Digital Certificate'
          }
        ]
      }
    }
  ]
}
