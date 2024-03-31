import { UserDynamoRepository, UserService, allowCorsConfig } from 'encurtame-commons-lambda'
import { ConflictingResourceException } from 'encurtame-commons-lambda'
import { Logger, LoggerGlobalInfoHolder } from 'encurtame-commons-lambda'

log4js.configure({
  appenders: { out: { type: 'stdout', layout: { type: 'coloured' } } },
  categories: { default: { appenders: ['out'], level: process.env.LOG_LEVEL || 'info' } }
})

const logger = Logger.getLogger('RegisterUserLambda')
const userRepository = new UserDynamoRepository()
const userService = new UserService(userRepository)

export const handler = async (event, context) => {
  LoggerGlobalInfoHolder.getInstance().correlationId = event.requestContext.requestId
  logger.info('Handling request...')
  const user = JSON.parse(event.body)
  logger.info(`Storing User: ${JSON.stringify(user)}`)
  let response = {};
  try {
    const userItem = await userService.insert(user)
    response = {
      statusCode: 201,
      body: JSON.stringify(userItem)
    }
  } catch (err) {
    logger.error(err)
    if(err instanceof ConflictingResourceException) {
      console.error(err)
      response = {
        statusCode: 409,
        body: JSON.stringify({ message: err.message })
      }
    }
    else {
      response = {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error storing user' })
      }
    }
  }
  return allowCorsConfig(response)
}
