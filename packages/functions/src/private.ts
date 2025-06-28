import { APIGatewayProxyHandlerV2 } from "aws-lambda";

export const main: APIGatewayProxyHandlerV2 = async (event) => {
  return {
    statusCode: 200,
    body: `event.requestContext:${event.requestContext}`,
  };
};
