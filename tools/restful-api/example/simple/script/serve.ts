import path from 'path'
import chalk from 'chalk'
import { execCommand, Router, ServeCommand, SubCommandHook } from 'restful-api-tool'


async function serve () {
  const projectDir = path.resolve()
  const args = ['', '', 'serve', projectDir, '--log-level=debug', '-s', 'schemas/answer']
  console.log(chalk.gray('--> ' + args.join(' ')))

  const serve = new ServeCommand()
  serve.onHook(SubCommandHook.BEFORE_START, (server, context) => {
    const router = new Router({ prefix: context.prefixUrl })
    router.get('/hello/world', ctx => {
      ctx.body = {
        code: 200,
        message: 'Got it!',
      }
    })
    server.registerRouter(router)
  })

  execCommand(args, { serve })
}


serve()
