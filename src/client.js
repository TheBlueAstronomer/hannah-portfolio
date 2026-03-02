// sanity.js
import { createClient } from '@sanity/client'
// Import using ESM URL imports in environments that supports it:
// import {createClient} from 'https://esm.sh/@sanity/client'

import imageUrlBuilder from '@sanity/image-url';

export const client = createClient({
  projectId: '3rrd1p6a',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2023-05-03',
  token: 'skuwN6iSDBRLDQQrHghIE4ozsjJwotOpA3wpApZejEcrcrHvrXCkytjBWg2foh880dZmN0YmvE0d195wYP4Dp0pz7sMY7M7K2COatU4pjG189iXpjUXyOzolQVVNEaArntPyaa0aLOtxvLs4gk9vJKFEoeTKLkPdtaNesWbtbiWeOZqIOrZR'
})

const builder = imageUrlBuilder(client);

export const urlFor = (source) => builder.image(source);