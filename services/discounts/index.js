const { delegateToSchema, makeExecutableSchema } = require('graphql-tools');
const { ApolloServer } = require('apollo-server');
const { transformSchemaFederation } = require('graphql-transform-federation')

const products = [
  {
    upc: '1',
    saleDiscountPct: 0.30,
  },
  {
    upc: '2',
    saleDiscountPct: null,
  },
  {
    upc: '3',
    saleDiscountPct: 0.10,
  },
];

const schemaWithoutFederation = makeExecutableSchema({
  typeDefs: `
    type Product {
      upc: String!
      saleDiscountPct: Float
    }
    
    type Query {
      productByUpc(upc: String!): Product!
    }
  `,
  resolvers: {
    Query: {
      productByUpc(source, { upc }) {
        return products.find(product => product.upc === upc);
      },
    },
  },
});

const federationSchema = transformSchemaFederation(schemaWithoutFederation, {
  Query: {
    extend: true,
  },
  Product: {
    extend: true,
    keyFields: ['upc'],
    fields: {
      upc: {
        external: true,
      },
    },
    resolveReference(reference, context, info) {
      return delegateToSchema({
        schema: info.schema,
        operation: 'query',
        fieldName: 'productByUpc',
        args: {
          upc: reference.upc,
        },
        context,
        info,
      });
    },
  },
});

const server = new ApolloServer({
  schema: federationSchema,
})

server.listen({ port: 4005, }).then(({ url }) => {
  console.log(`🚀 Discounts (transformed) server ready at ${url}`);
});