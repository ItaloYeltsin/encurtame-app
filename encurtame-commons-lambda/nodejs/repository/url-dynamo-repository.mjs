import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb'
import log4js from 'log4js'
import { nanoid } from 'nanoid'

const client = new DynamoDBClient()

export class URLDynamoRepository {
  constructor () {
    this.logger = log4js.getLogger('URLDynamoRepository')
  }

  async retrieve (id) {
    const params = {
      TableName: process.env.TABLE_NAME,
      Key: {
        id: { S: id }
      }
    }
    console.log(`Retrieving URL for id: ${id}`)
    const command = new GetItemCommand(params)
    return client.send(command).then((data) => {
      if (!data.Item) {
        console.log(`URL not found for id: ${id}`)
      }
      console.log(`URL found for id: ${id}, url: ${JSON.stringify(data.Item)}`)
      return data.Item
    }).catch((err) => {
      console.log(err)
      throw err
    })
  }

  async save (url) {
    const params = {
      TableName: process.env.TABLE_NAME,
      Item: {
        id: { S: nanoid(5) },
        url: { S: url }
      }
    }
    const command = new PutItemCommand(params)
    return client.send(command).then((data) => {
      console.log(`URL saved: ${JSON.stringify(data)}`)
      return { id: params.Item.id.S, url: params.Item.url.S }
    })
  }
}
