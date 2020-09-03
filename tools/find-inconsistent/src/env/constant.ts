import path from 'path'
export {
  name as packageName,
  version as packageVersion,
} from '@barusu/tool-find-inconsistent/package.json'


// Command name
export const COMMAND_NAME = 'barusu-find-inconsistent'


// Config files root dir
export const configRootDir = path.resolve(__dirname, '../config')
