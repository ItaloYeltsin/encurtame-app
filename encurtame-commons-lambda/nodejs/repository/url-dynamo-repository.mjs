import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { Logger } from '../logging/logger.mjs'
import { nanoid } from 'nanoid'

const client = new DynamoDBClient()

export class URLDynamoRepository {
  constructor () {
    this.logger = Logger.getLogger('URLDynamoRepository')
  }

  async retrieve (id) {
    const params = {
      TableName: process.env.TABLE_NAME,
      Key: {
        id: { S: id }
      }
    }
    this.logger.info(`Retrieving URL for id: ${id}`)
    const command = new GetItemCommand(params)
    return client.send(command).then((data) => {
      if (!data.Item) {
        this.logger.info(`URL not found for id: ${id}`)
      }
      this.logger.info(`URL found for id: ${id}, url: ${JSON.stringify(data.Item)}`)
      return data.Item
    }).catch((err) => {
      this.logger.error(err)
      throw err
    })
  }

  async save (url) {
    this.logger.info(`Saving URL...`)
    const params = {
      TableName: process.env.TABLE_NAME,
      Item: {
        id: { S: nanoid(5) },
        url: { S: url }
      }
    }
    const command = new PutItemCommand(params)
    return client.send(command).then((data) => {
      this.logger.info(`URL saved: ${JSON.stringify(data)}`)
      return { id: params.Item.id.S, url: params.Item.url.S }
    }).catch((err) => {
      this.logger.error(err)
      throw err
    })
  }
}
