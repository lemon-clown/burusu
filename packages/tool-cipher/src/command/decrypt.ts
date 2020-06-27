import { CommanderStatic } from 'commander'
import path from 'path'
import { Level } from '@barusu/chalk-logger'
import {
  convertToBoolean,
  convertToNumber,
  isNotEmptyString,
  parseOption,
} from '@barusu/option-util'
import { EventTypes, eventBus } from '../util/event-bus'
import { mkdirsIfNotExists } from '../util/fs'
import { logger } from '../util/logger'
import { CipherMaster } from '../util/master'
import { createDefaultOptions, handleError } from './_util'


const SUB_COMMAND_NAME = 'decrypt'


/**
 * load Sub-command: encrypt
 */
export function loadSubCommandDecrypt(
  name: string,
  program: CommanderStatic,
): void {
  program
    .command(`${ SUB_COMMAND_NAME }`)
    .option('-S, --secret-filepath <secret filepath>', 'path of secret file')
    .option('-I, --index-filepath <cipher files index>', 'path of index of cipher files')
    .option('-C, --cipher-filepath-pattern <glob pattern>', 'glob pattern of files have been encrypted', (val, acc: string[]) => acc.concat(val), [])
    .option('-o, --out-dir <outDir>', 'root dir of outputs')
    .option('--cipher-dir <cipherDir>', 'root dir of cipher files')
    .option('--show-asterisk', 'whether to print password asterisks')
    .option('--minimum-password-length', 'the minimum size required of password')
    .action(async function (options: any) {
      logger.setName(`${ name } ${ SUB_COMMAND_NAME }`)

      const workspaceDir: string = options.args[0] || path.resolve()
      logger.debug('workspaceDir:', workspaceDir)

      const packageJsonPath = path.resolve(workspaceDir, 'package.json')
      logger.debug('packageJsonPath:', packageJsonPath)

      const defaultOptions = createDefaultOptions(packageJsonPath, SUB_COMMAND_NAME)

      // reset log-level
      const logLevel = parseOption<string>(defaultOptions.logLevel, options.logLevel)
      if (logLevel != null) {
        const level = Level.valueOf(logLevel)
        if (level != null) logger.setLevel(level)
      }

      // get outDir
      const outDir: string = path.resolve(workspaceDir,
        parseOption<string>(
          defaultOptions.outDir, options.outDir, isNotEmptyString))
      logger.debug('outDir:', outDir)

      // get cipherDir
      const cipherDir: string = path.resolve(workspaceDir,
        parseOption<string>(
          defaultOptions.cipherDir, options.cipherDir, isNotEmptyString))
      logger.debug('cipherDir:', cipherDir)

      // get secretFilepath
      const secretFilepath: string = path.resolve(workspaceDir,
        parseOption<string>(
          defaultOptions.secretFilepath, options.secretFilepath, isNotEmptyString))
      logger.debug('secretFilepath:', secretFilepath)

      // get indexFilepath
      const indexFilepath: string = path.resolve(cipherDir,
        parseOption<string>(
          defaultOptions.indexFilepath, options.indexFilepath, isNotEmptyString))
      logger.debug('indexFilepath:', indexFilepath)

      // get showAsterisk
      const showAsterisk: boolean = parseOption<boolean>(
        defaultOptions.showAsterisk, convertToBoolean(options.showAsterisk))
      logger.debug('showAsterisk:', showAsterisk)

      // get miniumPasswordLength
      const miniumPasswordLength: number = parseOption<number>(
        defaultOptions.miniumPasswordLength, convertToNumber(options.miniumPasswordLength)
      )
      logger.debug('miniumPasswordLength:', miniumPasswordLength)

      // calc cipherRelativeDir
      const cipherRelativeDir = path.relative(workspaceDir, cipherDir)
      logger.debug('cipherRelativeDir:', cipherRelativeDir)

      // calc outputRelativeDir
      const outputRelativeDir = path.relative(workspaceDir, outDir)
      logger.debug('outputRelativeDir:', outputRelativeDir)

      // ensure paths exist
      mkdirsIfNotExists(workspaceDir, true)
      mkdirsIfNotExists(cipherDir, true)
      mkdirsIfNotExists(outDir, true)
      mkdirsIfNotExists(secretFilepath, false)
      mkdirsIfNotExists(indexFilepath, false)

      try {
        const master = new CipherMaster({
          workspaceDir,
          showAsterisk,
          secretFilepath,
          minimumSize: miniumPasswordLength,
        })

        const workspaceCatalog = await master.loadIndex(indexFilepath, cipherRelativeDir)
        if (workspaceCatalog == null) {
          throw new Error('[fix me] workspaceCatalog is null')
        }

        const resolveDestPath = (cipherFilepath: string) => {
          const plainFilepath: string | null = workspaceCatalog
            .resolvePlainFilepath(path.relative(cipherRelativeDir, cipherFilepath))
          if (plainFilepath == null) {
            throw new Error(`[fix me] plainFilepath is null: cipherFilepath(${ cipherFilepath })`)
          }
          return plainFilepath
        }

        const cipherFilepaths = workspaceCatalog.toData()
          .items.map(x => path.join(cipherRelativeDir, x.cipherFilepath))
        await master.decryptFiles(cipherFilepaths, outputRelativeDir, resolveDestPath)
      } catch (error) {
        handleError(error)
      }
      eventBus.dispatch({ type: EventTypes.EXITING })
    })
}