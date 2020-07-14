/* eslint-disable @typescript-eslint/no-var-requires */
import commandExists from 'command-exists'
import execa from 'execa'
import inquirer from 'inquirer'
import nodePlop from 'node-plop'
import path from 'path'
import { runPlop } from '@barusu/util-cli'
import { toLowerCase } from '@barusu/util-option'
import { templateRootDir } from '../../util/env'
import { logger } from '../../util/logger'
import { RestfulApiInitializerContext } from './context'


export async function renderTemplates(
  context: RestfulApiInitializerContext
): Promise<void> {
  const availableTemplates: string[] = ['simple']
  const { templateName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'templateName',
      default: availableTemplates[0],
      message: 'Which mock server template preferred?',
      choices: availableTemplates,
      filter: x => toLowerCase(x).trim(),
      transformer: (x: string) => toLowerCase(x).trim(),
    },
  ])

  const templateDir = path.join(templateRootDir, templateName)
  const templateConfig = path.join(templateDir, 'plop.js')
  logger.debug('templateDir:', templateDir)
  logger.debug('templateConfig:', templateConfig)

  const plop = nodePlop(templateConfig, { force: false, destBasePath: context.workspace })
  await runPlop(plop, logger, undefined, { workspace: context.workspace })
}


/**
 * Run `npm/yarn install` to Install node.js dependencies
 * @param execaOptions
 */
export async function installDependencies(execaOptions: execa.Options): Promise<void> {
  const hasYarnInstalled: boolean = commandExists.sync('yarn')

  /**
   * If neither yarn nor npm is installed, this operation will be skipped
   */
  if (!hasYarnInstalled) {
    const hasNpmInstalled: boolean = commandExists.sync('npm')
    if (!hasNpmInstalled) return
  }

  const { npmScript } = await inquirer.prompt([
    {
      type: 'list',
      name: 'npmScript',
      default: hasYarnInstalled ? 'yarn' : 'npm',
      message: 'npm or yarn?',
      choices: ['npm', 'yarn', 'skip'],
      filter: x => toLowerCase(x).trim(),
      transformer: (x: string) => toLowerCase(x).trim(),
    },
  ])

  // skip installing dependencies
  if (npmScript === 'skip') return

  // install dependencies
  await execa(npmScript, ['install'], execaOptions)
}


/**
 * Create initial commit
 */
export async function createInitialCommit(
  execaOptions: execa.Options,
): Promise<void> {
  /**
   * If git is not installed yet, this operation will be skipped
   */
  const hasGitInstalled: boolean = commandExists.sync('git')
  if (!hasGitInstalled) {
    return
  }

  const { doInitialCommit } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'doInitialCommit',
      default: false,
      message: 'Create initial commit?',
    },
  ])

  // skip
  if (!doInitialCommit) return

  // create init commit
  await execa('git', ['init'], execaOptions)
  await execa('git', ['add', '-A'], execaOptions)
  await execa('git', ['commit', '-m', ':tada:  initialize.'], execaOptions)
}