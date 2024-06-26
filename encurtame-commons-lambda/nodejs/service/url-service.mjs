import { NotFoundException } from '../exception/not-found-exception.mjs'
import { Logger } from '../logging/logger.mjs'

export class URLService {
  constructor (urlRepository) {
    this.urlRepository = urlRepository
    this.logger = Logger.getLogger('URLService')
  }

  async get (id) {
    try {
      const urlItem = await this.urlRepository.retrieve(id)
      if (!urlItem || !urlItem.url) {
        throw new NotFoundException(`URL not found for id: ${id}`)
      }
      return urlItem.url.S
    } catch (err) {
      this.logger.error(err)
      throw err
    }
  }

  async insert (urlEntry) {
    return this.urlRepository.save(urlEntry)
  }
}
