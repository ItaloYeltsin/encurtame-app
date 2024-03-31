
import { URLDynamoRepository, URLService, NotFoundException } from 'encurtame-commons-lambda'
import { Logger, LoggerGlobalInfoHolder } from 'encurtame-commons-lambda'
import { allowCorsConfig } from 'encurtame-commons-lambda'


const logger = Logger.getLogger('GetURLLambda')
const urlRepository = new URLDynamoRepository()
const urlService = new URLService(urlRepository)

export const handler = async (event, context) => {
  let response = {}
  LoggerGlobalInfoHolder.getInstance().correlationId = event.requestContext.requestId
  logger.info('Handling request...')
  const id = event.pathParameters.id
  logger.info(`Getting URL for id: ${id}`)
  try {
    const url = await urlService.get(id)
    logger.info(`Got URL: ${JSON.stringify(url)}}`)
    response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Required for CORS support to work'
      },
      body: JSON.stringify({ url: url })
    }
  } catch (err) {
    logger.error(`Error getting URL: ${err}`)
    if (err instanceof NotFoundException) {
      response = {
        statusCode: 404,
        body: JSON.stringify({ message: err.message })
      }
    }
    response = {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error getting URL' })
    }
  }
  return allowCorsConfig(response)
}
