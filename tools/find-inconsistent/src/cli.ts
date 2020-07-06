import program from 'commander'
import path from 'path'
import { version } from '@barusu/tool-find-inconsistent/package.json'
import { PackageManager } from './index'
import { COMMAND_NAME, logger } from './util'


program
  .version(version)

logger.registerToCommander(program)


program
  .name(COMMAND_NAME)
  .usage('[path of package.json] [options]')
  .arguments('[path of package.json]')
  .action(function (cmd, options: any) {
    let packageJsonPath = options.args[0] || 'package.json'
    if (!packageJsonPath.endsWith('package.json')) {
      // eslint-disable-next-line no-param-reassign
      packageJsonPath = path.join(packageJsonPath, 'package.json')
    }

    logger.verbose('packageJsonPath:', packageJsonPath)
    const rootPackageJsonPath = path.resolve(packageJsonPath)
    const manager = new PackageManager
    manager.resolve(rootPackageJsonPath)
  })
  .parse(process.argv)
