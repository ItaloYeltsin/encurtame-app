import { URLDynamoRepository, URLService, allowCorsConfig } from 'encurtame-commons-lambda'
import { Logger, LoggerGlobalInfoHolder } from 'encurtame-commons-lambda'

const logger = Logger.getLogger('StoreURLLambda')
const urlRepository = new URLDynamoRepository()
const urlService = new URLService(urlRepository)

export const handler = async (event, context) => {
  LoggerGlobalInfoHolder.getInstance().correlationId = event.requestContext.requestId
  logger.info('Handling request...')
  const url = JSON.parse(event.body).url
  logger.info(`Storing URL: ${url}`)
  let response = {};
  try {
    const urlItem = await urlService.insert(url)
    response = {
      statusCode: 200,
      body: JSON.stringify(urlItem)
    }
  } catch (err) {
    logger.error(`Error storing URL: ${err}`)
    response = {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error getting URL' })
    }
  }
  return allowCorsConfig(response)
}
