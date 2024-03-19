export class ConflictingResourceException extends Error {
  constructor (message) {
    super(message)
    this.name = 'ConflictingResourceException'
  }
}
