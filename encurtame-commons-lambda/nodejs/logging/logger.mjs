import log4js from 'log4js'

var LoggerGlobalInfoHolderInstance = null

export class LoggerGlobalInfoHolder {
    static getInstance() {
        if (LoggerGlobalInfoHolderInstance == null) {
            LoggerGlobalInfoHolderInstance = new Logger()
        }
        return LoggerGlobalInfoHolderInstance
    }
}

log4js.configure({
    appenders: {
        out: {
            type: 'stdout',
            layout: {
                type: 'pattern',
                pattern: '%d [%p] %x{correlationId} %m%n',
                tokens: {
                    correlationId: function() {
                        return LoggerGlobalInfoHolder.getInstance().correlationId
                    }
                }
            }
        }
    },
    categories: { default: { appenders: ['out'], level: process.env.LOG_LEVEL || 'info' } }
})


export class Logger {
    constructor() {

    }

    static getLogger(componentName) {
        return log4js.getLogger(componentName)
    }
}
