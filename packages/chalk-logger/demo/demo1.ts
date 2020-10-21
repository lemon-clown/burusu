import { ChalkLogger, ERROR } from '../src'


const logger = new ChalkLogger({
  name: 'demo',
  level: ERROR,   // the default value is INFO
  date: false,    // the default value is false.
  colorful: true, // the default value is true.
}, process.argv)


logger.debug('A', 'B', 'C')
logger.verbose('A', 'B', 'C')
logger.info('a', 'b', 'c')
logger.warn('X', 'Y', 'Z', { a: 1, b: 2 })
logger.error('x', 'y', 'z', { c: { a: 'hello' }, b: { d: 'world' } })
logger.fatal('1', '2', '3')
