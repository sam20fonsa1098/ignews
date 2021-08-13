import Prismic from '@prismicio/client';

const getPrismicClient = function(req?: unknown) {
  const prismic = Prismic.client(
    process.env.PRISMIC_ENDPOINT,
    {
      req,
      accessToken: process.env.PRISMIC_KEY,
    },
  )
  return prismic;
}

export { getPrismicClient };