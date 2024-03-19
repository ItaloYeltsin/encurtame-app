import { DynamoDBClient, ScanCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { transformfromDynamo, transformToDynamo } from '../util/dynamo-dao-transformation.mjs'
import log4js from 'log4js'
import { ConflictingResourceException } from '../exception/conflicting-resource-exception.mjs'
const client = new DynamoDBClient()
export class UserDynamoRepository {
  constructor () {
    this.logger = log4js.getLogger('UserDynamoRepository')
    this.client = client
  }

  async retrieve (user) {
    const params = {
      TableName: process.env.TABLE_NAME,
      FilterExpression: 'email = :emailValue',
      ExpressionAttributeValues: {
        ':emailValue': { S: user.email }
      }
    }
    console.log(params)
    const command = new ScanCommand(params)
    return this.client.send(command).then((data) => {
      return data.Items.map(transformfromDynamo)
    })
  }

  async save (user) {
    // ensure email uniquness by getting item first
    const existingUsers = await this.retrieve(user)
    if (existingUsers.length > 0) {
      console.log(`User already exists: ${JSON.stringify(existingUsers)}`)
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
      throw err
    })
  }
}
