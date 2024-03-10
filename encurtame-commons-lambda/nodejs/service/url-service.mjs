import { NotFoundException } from '../exception/not-found-exception.mjs'
import log4js from 'log4js'

var logger;

export class URLService {
  constructor (urlRepository) {
    this.urlRepository = urlRepository
    logger = log4js.getLogger('URLService');
  }

  async get (id) {
    try {
      const urlItem = await this.urlRepository.retrieve(id)
      if (!urlItem || !urlItem.url) {
        throw new NotFoundException(`URL not found for id: ${id}`)
      }
      return urlItem.url.S
    } catch (err) {
      logger.error(err);
      throw err
    }
  }

  async insert (urlEntry) {
    return this.urlRepository.save(urlEntry)
  }
}
