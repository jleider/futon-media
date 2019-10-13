import * as _ from 'lodash'
import * as dayjs from 'dayjs'
import * as emby from '@/emby/emby'
import * as fastParse from 'fast-json-parse'
import * as qs from '@/shims/query-string'
import * as Rx from '@/shims/rxjs'
import * as Url from 'url-parse'
import * as utils from '@/utils/utils'
import exithook = require('exit-hook')
import Sockette, { ISockette } from '@/shims/sockette'

export interface EmbyEvent<Data = any> {
	Data: Data
	MessageId: string
	MessageType: string
}
export const rxSocket = new Rx.Subject<EmbyEvent>()

let ws: ISockette
process.nextTick(() => {
	let url = `${process.env.EMBY_LAN_ADDRESS}/embywebsocket?${qs.stringify({
		api_key: process.env.EMBY_ADMIN_TOKEN || process.env.EMBY_API_KEY,
	})}`
	ws = new Sockette(url, {
		timeout: utils.duration(3, 'second'),
		onerror({ error }) {
			console.error(`socket onerror -> %O`, error)
			emby.Tail.disconnect()
		},
		onclose({ code, reason }) {
			console.warn(`socket onclose ->`, code, reason)
			emby.Tail.disconnect()
		},
		onopen({ target }) {
			let url = target.url as string
			console.info(`socket onopen ->`, url.slice(0, url.indexOf('?')))
			ws.json({ MessageType: 'SessionsStart', Data: '0,1500,900' })
			ws.json({ MessageType: 'ScheduledTasksInfoStart', Data: '0,1000' })
			ws.json({ MessageType: 'ActivityLogEntryStart', Data: '0,1500' })
			emby.Tail.connect()
		},
		onmessage({ data }) {
			let { err, value } = fastParse(data)
			if (err) return console.error(`socket onmessage -> %O`, err)
			rxSocket.next(value)
		},
	})
	exithook(() => ws.close())
})

rxSocket.subscribe(({ MessageType, Data }) => {
	if (['ScheduledTasksInfo'].includes(MessageType)) {
		// console.info(`rxSocket ->`, MessageType, '...')
		return
	}
	// if (MessageType == 'Sessions') {
	// 	let Sessions = Data as emby.Session[]
	// 	Sessions = Sessions.filter(({ UserName }) => !!UserName).map(v => new emby.Session(v))
	// 	Sessions.sort((a, b) => b.Stamp - a.Stamp)
	// 	console.info(`rxSocket Sessions ->`, Sessions /** .map(v => v.RemoteEndPoint) */)
	// 	return
	// }
	// console.info(`rxSocket ->`, MessageType, Data)
})

//

// 	if (MessageType == 'LibraryChanged') {
// 		console.warn(`rxSocket ->`, MessageType, Data)
// 	}
// 	// if (MessageType == 'ScheduledTasksInfo') {
// 	// 	let tasks = Data as emby.ScheduledTasksInfo[]
// 	// 	let task = tasks.find(v => v.Key == 'RefreshLibrary')
// 	// 	return console.log(`rxSocket ->`, 'ScheduledTasksInfo', task)
// 	// }
// })

// export const socket = {
// 	send(EmbyEvent: Partial<EmbyEvent>) {
// 		console.log(`socket send ->`, JSON.stringify(EmbyEvent))
// 		console.log(`emby ws ->`, ws)
// 		ws.json(EmbyEvent)
// 	},
// 	filter<Data>(MessageType: string) {
// 		return rxSocket.pipe(
// 			Rx.op.filter(EmbyEvent => EmbyEvent.MessageType == MessageType),
// 			Rx.op.map(({ Data }) => Data as Data)
// 		)
// 	},
// }

// socket.filter<emby.Session[]>('Sessions').subscribe(async () => {})

// export const rxSessions = socket.filter<emby.Session[]>('Sessions').pipe(
// 	Rx.Op.map(Sessions => {
// 		Sessions = Sessions.filter(({ UserName }) => !!UserName).map(v => new emby.Session(v))
// 		return Sessions.sort((a, b) => b.Stamp - a.Stamp)
// 	})
// )

// rxSocket.subscribe(({ MessageType, Data }) => {
// 	if (MessageType == 'Sessions') {
// 		let Sessions = emby.sessions.parse(Data)
// 		// console.log(`Sessions ->`, Sessions)
// 		// console.log(`rxSocket ->`, Sessions.map(v => `${v.DeviceName} -> ${v.age}`))
// 	}
// })

// export const rxSocket = rxMessage.pipe(
// 	Rx.Op.map(({ MessageType, MessageId, Data }) => {
// 		if (MessageType == 'Sessions') {
// 			MessageType = 'Session'
// 			Data = emby.sessions.parse(Data)[0]
// 		}
// 		return { MessageType, MessageId, Data } as EmbyEvent
// 	})
// )
// rxSocket.subscribe(({ MessageType, Data }) => {
// 	console.log(`rxSocket ->`, MessageType, Data)
// })
