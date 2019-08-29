setInterval(Function, 1 << 30)

import 'module-alias/register'
import 'dotenv/config'
import 'node-env-dev'
import '@/devops/devops'

async function start() {
	await (await import('@/emby/config')).setup()
	if (process.args.scripts) {
		return await import(`@/scripts/${process.args.scripts}`)
	}
	await import('@/emby/collections')
	await import('@/emby/favorites')
	await import('@/emby/proxy')
	await import('@/emby/search')
	await import('@/emby/strm')
	await import('@/scrapers/discovery')
}
process.nextTick(() => start().catch(error => console.error(`start -> %O`, error)))
