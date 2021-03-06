const generator = (config) => {

  return `
    ${imports(config)}
    ${graphql(config)}
    ${graphiql(config)}
    ${subscriptionServer(config)}
  `;
}

/**
 * generate the imports chunk of the server code
 * @param config
 * @returns {string}
 */
const imports = (config) => {
  let generated = `
    require('dotenv').config();
    import express from 'express';
    import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
    import bodyParser from 'body-parser';
    import cors from 'cors';
    import { printSchema } from 'graphql/utilities/schemaPrinter';
    import schema from './data/schema';
  `;
  if (config.subscriptions) {
    generated += `
      import { execute, subscribe } from 'graphql';
      import { createServer } from 'http';
      import { SubscriptionServer } from 'subscriptions-transport-ws';
    `;
  }

  return generated;
};

/**
 * generate the graphQL middleware chunk of the server code
 * @param config
 * @returns {string}
 */
const graphql = (config) => {
  return `
    const graphQLServer = express().use('*', cors());
    
    graphQLServer.use(\`/\${process.env.GRAPHQL_PATH}\`, bodyParser.json(), graphqlExpress({
      schema,
      context: {},
    }));

    
    graphQLServer.listen(process.env.GRAPHQL_PORT, () => console.log(
      \`GraphQL Server is now running on http://localhost:\${process.env.GRAPHQL_PORT}/\${process.env.GRAPHQL_PATH}\`
    ));
  `;
};

/**
 * generate the graphiql middleware chunk of the server code
 * @param config
 * @returns {string}
 */

const graphiql = (config) => {
  if (config.subscriptions) {
    return `
    graphQLServer.use(\`/\${process.env.GRAPHIQL_PATH}\`, graphiqlExpress({
      endpointURL: \`/\${process.env.GRAPHQL_PATH}\`,
      subscriptionsEndpoint: \`ws://localhost:\${process.env.WS_PORT}\${process.env.WS_PATH}\`,
    }));
    `;
  }

  return `
    graphQLServer.use(\`/\${process.env.GRAPHIQL_PATH}\`, graphiqlExpress({
      endpointURL: \`/\${process.env.GRAPHIQL_PATH}\`,
    }));
    `;
};

/**
 * generate the subscriptionServer chunk of the server code
 * @param config
 * @returns {*}
 */
const subscriptionServer = (config) => {
  if (!config.subscriptions) {
    return '';
  }

  return `
    // WebSocket server for subscriptions
    const websocketServer = createServer((request, response) => {
      response.writeHead(404);
      response.end();
    });

    websocketServer.listen(process.env.WS_PORT, () => console.log( // eslint-disable-line no-console
      \`Websocket Server is now running on ws://localhost:\${process.env.WS_PORT}\${process.env.WS_PATH}\`
        ));
    
    // eslint-disable-next-line
    const subscriptionServer = SubscriptionServer.create(
      {
        schema,
        execute,
        subscribe,
      },
      {
        server: websocketServer,
        path: \`\${process.env.WS_PATH}\`,
      },
    );
  `;
};


module.exports = generator;