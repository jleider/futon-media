import * as _ from 'lodash'
import * as debrid from '@/debrids/debrid'
import * as http from '@/adapters/http'
import * as magneturi from 'magnet-uri'
import * as pAll from 'p-all'
import * as path from 'path'
import * as utils from '@/utils/utils'

export const client = new http.Http({
	baseUrl: 'https://www.premiumize.me/api',
	qsArrayFormat: 'bracket',
	query: {
		customer_id: process.env.PREMIUMIZE_ID,
		pin: process.env.PREMIUMIZE_PIN,
	},
})

export class Premiumize extends debrid.Debrid {
	static async cached(hashes: string[]) {
		hashes = hashes.map(v => v.toLowerCase())
		let chunks = utils.chunks(hashes, 40)
		let cached = hashes.map(v => false)
		await pAll(
			chunks.map(chunk => async () => {
				await utils.pRandom(1000)
				let response = (await client.post(`/cache/check`, {
					query: { items: chunk },
				})) as CacheResponse
				chunk.forEach((hash, i) => {
					if (_.get(response, `response[${i}]`) == true) {
						cached[hashes.findIndex(v => v == hash)] = true
					}
				})
			}),
			{ concurrency: 3 }
		)
		return cached
	}

	async sync() {
		let content = (await client.post(`/transfer/directdl`, {
			query: { src: this.magnet },
		})).content as Item[]
		this._files = (content || []).map(file => {
			let name = path.basename(file.path)
			return {
				bytes: _.parseInt(file.size),
				link: file.link,
				name: name.slice(0, name.lastIndexOf('.')),
				path: `/${file.path}`,
			} as debrid.File
		})
		this._files.sort((a, b) => utils.parseInt(a.name) - utils.parseInt(b.name))
		return this.files
	}

	async link(file: debrid.File) {
		return file.link
	}
}

interface CacheResponse {
	filename: string[]
	filesize: number[]
	response: boolean[]
	status: string
	transcoded: boolean[]
}

interface TransferCreateResponse {
	error: string
	id: string
	message: string
	name: string
	status: string
}

interface Transfer {
	file_id: string
	folder_id: string
	id: string
	message: string
	name: string
	progress: number
	status: string
}

interface Item {
	cdn_hostname: string
	created_at: number
	id: string
	link: string
	name: string
	path: string
	size: string
	stream_link: string
	transcode_status: string
	type: string
}

interface Folder {
	content: Item[]
	name: string
	parent_id: string
	status: string
}
