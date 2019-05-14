import * as _ from 'lodash'
import * as pAll from 'p-all'
import * as dayjs from 'dayjs'
import * as debrid from '@/debrids/debrid'
import * as media from '@/media/media'
import * as torrent from '@/scrapers/torrent'
import * as utils from '@/utils/utils'
import ffprobe, { FFProbe } from '@/adapters/ffprobe'
import { Premiumize } from '@/debrids/premiumize'
import { Putio } from '@/debrids/putio'
import { RealDebrid } from '@/debrids/realdebrid'

export const debrids = { premiumize: Premiumize, realdebrid: RealDebrid, putio: Putio }

export async function cached(hashes: string[]) {
	let entries = Object.entries(debrids)
	let resolved = await Promise.all(entries.map(([k, v]) => v.cached(hashes)))
	return hashes.map((v, index) => {
		return entries.map(([key], i) => resolved[i][index] && key).filter(Boolean)
	}) as Debrids[][]
}

// async function eachStreamUrl(
// 	torrent: torrent.Torrent,
// 	item: media.Item,
// 	channels: number,
// 	codecs: string[]
// ) {
// 	let putios = torrents.filter(v => v.cached.includes('putio'))
// 	if (putios.length > 0) {
// 		let results = await pAll(
// 			putios.map(torrent => async () => {
// 				await utils.pRandom(1000)
// 				let debrid = new debrids.putio().use(torrent.magnet)
// 			})
// 		)
// 	}
// }

export async function getStreamUrl(
	torrents: torrent.Torrent[],
	item: media.Item,
	channels: number,
	codecs: string[]
) {
	for (let torrent of torrents) {
		let next = false
		for (let cached of torrent.cached) {
			if (next) continue
			console.log(`getStreamUrl '${cached}' torrent ->`, torrent.json)
			let debrid = new debrids[cached]().use(torrent.magnet)

			let files = (await debrid.getFiles().catch(error => {
				console.error(`getFiles -> %O`, error)
			})) as debrid.File[]
			if (!files) continue
			if (files.length == 0) {
				console.warn(`!files ->`, torrent.name)
				next = true
				continue
			}

			let file: debrid.File
			if (item.type == 'show') {
				let tests = [
					`S${item.S.z}E${item.E.z}`,
					`S${item.S.z}xE${item.E.z}`,
					`${item.S.n}x${item.E.z}`,
					`${item.S.n}x${item.E.n}`,
					`${item.S.n}${item.E.z}`,
					`Episode${item.E.z}`,
					`Ep${item.E.z}`,
					`E${item.E.z}`,
					`${item.E.z}`,
				]
				let skips = `${item.title} ${item.year} ${item.E.t}`
				for (let test of tests) {
					file = files.find(v => {
						let name = _.trim(utils.accuracy(skips, v.name).join(' '))
						return utils.minify(name).includes(utils.minify(test))
					})
					if (file) break
				}
				!file && console.warn(`!show file ->`, files.map(v => v.name).sort())
			}
			if (!file) {
				let title = item.title
				item.show && (title += ` S${item.S.z}E${item.E.z} ${item.E.t}`)
				let levens = files.map(file => ({ ...file, leven: utils.leven(file.name, title) }))
				file = levens.sort((a, b) => a.leven - b.leven)[0]
			}

			let stream = (await debrid.streamUrl(file).catch(error => {
				console.error(`debrid.streamUrl -> %O`, error)
			})) as string
			if (!stream) continue
			stream.startsWith('http:') && (stream = stream.replace('http:', 'https:'))

			let probe = (await ffprobe(stream, { format: true, streams: true }).catch(error => {
				console.error(`ffprobe '${stream}' -> %O`, error)
			})) as FFProbe
			if (!probe) continue

			let fkeys = ['bit_rate', 'duration', 'filename', 'format_long_name', 'size']
			console.log(`probe format ->`, _.pick(probe.format, fkeys))

			probe.streams = probe.streams.filter(({ codec_type }) =>
				['video', 'audio'].includes(codec_type)
			)

			// let tags = {} as Record<string, string>
			// _.defaults(tags, probe.format.tags, ...probe.streams.map(v => v.tags))
			// tags = _.pick(tags, _.keys(tags).filter(v => v.includes('date') || v.includes('time')))
			// let creation = _.size(tags) > 0 && dayjs(_.values(tags)[0])
			// if (creation && creation.subtract(1, 'day').valueOf() < item.released) {
			// 	console.warn(
			// 		`probe !creation ->`,
			// 		creation.toLocaleString(),
			// 		dayjs(item.released).toLocaleString()
			// 	)
			// 	next = true
			// 	continue
			// }

			let videos = probe.streams.filter(({ codec_name, codec_type, tags }) => {
				if (codec_type != 'video') return false
				if (codec_name == 'mjpeg') return false
				if (!tags || !tags.language) return true
				return tags.language.startsWith('en') || tags.language.startsWith('un')
			})
			if (videos.length == 0) {
				console.warn(`probe videos.length == 0 ->`, torrent.name)
				next = true
				continue
			}
			let vkeys = ['codec_long_name', 'codec_name', 'profile']
			console.log(`probe videos ->`, videos.map(v => _.pick(v, vkeys)))
			if (_.size(codecs) > 0 && !codecs.includes(videos[0].codec_name)) {
				console.warn(`probe !codecs ->`, torrent.name, videos[0].codec_name)
				next = true
				continue
			}

			let audios = probe.streams.filter(({ codec_type, tags }) => {
				if (codec_type != 'audio') return false
				if (!tags) return true
				if (tags.title && tags.title.includes('commentary')) return false
				if (!tags.language) return true
				return tags.language.startsWith('en') || tags.language.startsWith('un')
			})
			if (audios.length == 0) {
				console.warn(`probe audios.length == 0 ->`, torrent.name)
				next = true
				continue
			}
			let akeys = ['channel_layout', 'channels', 'codec_long_name', 'codec_name', 'profile']
			console.log(`probe audios ->`, audios.map(v => _.pick(v, akeys)))
			if (audios.filter(v => v.channels <= channels).length == 0) {
				// if (audios[0].channels > channels) {
				console.warn(`probe !channels ->`, torrent.name, audios.map(v => v.channels))
				next = true
				continue
			}

			return stream
		}
	}
}

export type Debrids = keyof typeof debrids
