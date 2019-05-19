import * as _ from 'lodash'
import * as emby from '@/emby/emby'
import * as execa from 'execa'
import * as fs from 'fs-extra'
import * as path from 'path'
import * as qs from 'query-string'
import * as Rx from '@/shims/rxjs'
import * as schedule from 'node-schedule'
import * as Url from 'url-parse'
import * as utils from '@/utils/utils'
import exithook = require('exit-hook')

export const rxTail = new Rx.Subject<string>()

export class Tail {
	static tail: Tail
	static logfile: string

	static reconnect = _.debounce(Tail.connect, utils.duration(5, 'second'))
	static async connect() {
		Tail.reconnect()
		if (!Tail.logfile) {
			let [{ LogPath }, [{ Name }]] = (await Promise.all([
				emby.client.get('/System/Info', { silent: true }),
				emby.client.get('/System/Logs', { silent: true }),
			])) as [emby.SystemInfo, emby.SystemLog[]]
			Tail.logfile = path.join(LogPath, Name)
		}
		if (!fs.pathExistsSync(Tail.logfile)) return console.warn(`Tail !fs.pathExistsSync`)
		if (Tail.tail && !Tail.tail.child.killed) return
		Tail.tail = new Tail(Tail.logfile)
	}
	static destroy() {
		Tail.tail && Tail.tail.destroy()
		Tail.reconnect()
	}

	child: execa.ExecaChildProcess
	constructor(logfile: string) {
		console.info(`new Tail ->`, path.basename(logfile))

		this.child = execa('tail', ['-fn0', logfile], { killSignal: 'SIGTERM' })
		this.child.stdout.on('data', (chunk: string) => {
			chunk = `\n${_.trim((chunk || '').toString())}`
			let lines = chunk.split(/\n\d{4}-\d{2}-\d{2}\s/g)
			for (let line of lines) {
				line = _.trim(line || '')
				line && rxTail.next(line)
			}
		})
		this.child.stdout.once('error', error => {
			console.error(`Tail child stdout error -> %O`, error)
			this.destroy()
		})
		this.child.stderr.once('error', error => {
			console.error(`Tail child stderr error -> %O`, error)
			this.destroy()
		})
		this.child.stderr.once('data', (chunk: string) => {
			console.error(`Tail child stderr -> %O`, _.trim((chunk || '').toString()))
			this.destroy()
		})
		this.child.once('message', message => {
			console.log(`Tail child message ->`, message)
		})
		this.child.once('error', error => {
			console.error(`Tail child error -> %O`, error)
			this.destroy()
		})
		this.child.once('close', (code, signal) => {
			console.warn(`Tail child close ->`, code, signal)
			this.destroy()
		})
		this.child.once('disconnect', () => {
			console.warn(`Tail child disconnect`)
			this.destroy()
		})
		this.child.once('exit', (code, signal) => {
			console.error(`Tail child exit ->`, code, signal)
			this.destroy()
		})
	}

	destroy = _.once(() => {
		this.child.kill('SIGTERM')
		process.nextTick(() => {
			this.child.removeAllListeners()
			this.child.stdout.removeAllListeners()
			this.child.stderr.removeAllListeners()
		})
		Tail.reconnect()
	})
}

exithook(() => Tail.destroy())

const JUNK = [
	'.png',
	'/images/',
	'/info/public',
	'/strings/en-us.json',
	'/system/endpoint',
	'/system/info',
	'/system/wakeonlaninfo',
	'/web/manifest.json',
]
export const rxHttp = rxTail.pipe(
	Rx.op.map(line => {
		if (line.match(/Info HttpServer: HTTP [DGP]/)) {
			/**
				TODO:
				- add http method to matches
			**/
			return (line.match(/\b\s(http.*)\.\s\b/) || [])[1] as string
		}
	}),
	Rx.op.filter(match => !!match),
	Rx.op.map(match => qs.parseUrl(match) as { url: string; query: Record<string, string> }),
	Rx.op.filter(({ url }) => !JUNK.find(v => url.toLowerCase().includes(v))),
	Rx.op.map(({ url, query }) => {
		query = _.mapKeys(query, (v, k) => _.upperFirst(k))
		let parts = new Url(url).pathname.toLowerCase().split('/')
		for (let i = 0; i < parts.length; i++) {
			let [part, next] = [parts[i], parts[i + 1]]
			if (!next) continue
			if (part == 'users' && next.length == 32) query.UserId = next
			if (['items', 'movies', 'shows', 'episodes', 'favoriteitems'].includes(part)) {
				if (utils.isNumeric(next)) query.ItemId = next
				if (next.length == 32) query.ItemId = next
			}
		}
		return { url, query }
	})
)

// rxHttp.subscribe(({ url, query }) => {
// 	console.log(`rxHttp ->`, url)
// })
