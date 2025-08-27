import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'src/graphql/schema.graphql',
  documents: 'src/graphql/**/*.{ts,tsx,graphql,gql}',
  generates: {
    'src/graphql/generated/types.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo'
      ],
      config: {
        withHooks: true,
        withHOC: false,
        withComponent: false,
        skipTypename: false,
        enumsAsTypes: true,
        constEnums: true,
        futureProofEnums: true,
        dedupeOperationSuffix: true,
        omitOperationSuffix: false,
        exportFragmentSpreadSubTypes: true,
        experimentalFragmentVariables: true,
        nonOptionalTypename: true,
        avoidOptionals: {
          field: true,
          inputValue: false,
          object: false,
          defaultValue: false
        }
      }
    },
    'src/graphql/generated/introspection.json': {
      plugins: ['introspection']
    }
  },

};

export default config;