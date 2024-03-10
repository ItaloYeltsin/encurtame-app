import { URLDynamoRepository, URLService } from 'encurtame-commons-lambda'
import log4js from 'log4js'

log4js.configure({
  appenders: { out: { type: 'stdout', layout: { type: 'coloured' } } },
  categories: { default: { appenders: ['out'], level: process.env.LOG_LEVEL || 'info' } }
})

const logger = log4js.getLogger('StoreURLLambda')
const urlRepository = new URLDynamoRepository()
const urlService = new URLService(urlRepository)

export const handler = async (event) => {
  logger.info('Handling request...')
  const url = JSON.parse(event.body).url
  logger.info(`Storing URL: ${url}`)
  try {
    const urlItem = await urlService.insert(url)
    return {
      statusCode: 200,
      body: JSON.stringify(urlItem)
    }
  } catch (err) {
    logger.error(`Error storing URL: ${err}`)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error getting URL' })
    }
  }
}
