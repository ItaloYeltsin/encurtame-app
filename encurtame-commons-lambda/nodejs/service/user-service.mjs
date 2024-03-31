import { NotFoundException } from '../exception/not-found-exception.mjs'
import { Logger } from '../logging/logger.mjs'
import { v4 as uuidv4 } from 'uuid'
import { passEncrypt } from '../util/encryption.mjs'
let logger

export class UserService {
  constructor (userRepository) {
    this.userRepository = userRepository
    this.logger = Logger.getLogger('UserService')
  }

  async get (email) {
    try {
      const user = await this.userRepository.retrieve(email)
      if (!user) {
        throw new NotFoundException(`User not found for id: ${email}`)
      }
      return user
    } catch (err) {
      this.logger.error(err)
      throw err
    }
  }

  async insert (userEntry) {
    this.logger.info('Generating userId...')
    userEntry.id = uuidv4()
    this.logger.info('Encrypting password...')
    userEntry.password = await passEncrypt(userEntry.password)
    this.logger.info('Saving user...')
    const user = await this.userRepository.save(userEntry)
    // return only email and id from user
    return { id: user.id, email: user.email }
  }
}
