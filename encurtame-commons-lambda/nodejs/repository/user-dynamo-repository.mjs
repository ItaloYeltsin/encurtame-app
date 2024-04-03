import { DynamoDBClient, QueryCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { transformfromDynamo, transformToDynamo } from '../util/dynamo-dao-transformation.mjs'
import { Logger } from '../logging/logger.mjs'
import { ConflictingResourceException } from '../exception/conflicting-resource-exception.mjs'
const client = new DynamoDBClient()
export class UserDynamoRepository {
  constructor () {
    this.logger = Logger.getLogger('UserDynamoRepository')
    this.client = client
  }

  async retrieve (user) {
    const params = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: 'email = :emailValue',
      ExpressionAttributeValues: {
        ':emailValue': { "S": user.email }
      },
      IndexName: 'email-index',
      Limit: 1
    }
    this.logger.info('Retrieving user for email: ' + user.email)
    const command = new QueryCommand(params)
    return this.client.send(command).then((data) => {
      return data.Items.map(transformfromDynamo)
    })
  }

  async save (user) {
    // ensure email uniquness by getting item first
    const existingUsers = await this.retrieve(user)
    if (existingUsers.length > 0) {
      this.logger.info(`User already exists: ${JSON.stringify(existingUsers)}`)
      throw new ConflictingResourceException('Email already exists')
    }

    const params = {
      TableName: process.env.TABLE_NAME,
      Item: transformToDynamo(user)
    }
    const command = new PutItemCommand(params)
    return this.client.send(command).then((data) => {
      return { id: user.id, email: user.email }
    }).catch((err) => {
      this.logger.error(err)
      throw err
    })
  }
}
