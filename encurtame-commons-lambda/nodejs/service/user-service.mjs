import { NotFoundException } from '../exception/not-found-exception.mjs'
import log4js from 'log4js'
import { v4 as uuidv4 } from 'uuid'
import { passEncrypt } from '../util/encryption.mjs'
let logger

export class UserService {
  constructor (userRepository) {
    this.userRepository = userRepository
    logger = log4js.getLogger('URLService')
  }

  async get (email) {
    try {
      const user = await this.userRepository.retrieve(email)
      if (!user) {
        throw new NotFoundException(`User not found for id: ${email}`)
      }
      return user
    } catch (err) {
      logger.error(err)
      throw err
    }
  }

  async insert (userEntry) {
    userEntry.id = uuidv4()
    userEntry.password = await passEncrypt(userEntry.password)
    const user = await this.userRepository.save(userEntry)
    // return only email and id from user
    return { id: user.id, email: user.email }
  }
}
