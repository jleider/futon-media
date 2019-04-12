import * as _ from 'lodash'
import * as utils from '@/utils/utils'
import * as http from '@/adapters/http'
import * as scraper from '@/scrapers/scraper'

const CONFIG = {
	throttle: 100,
}

export const client = new http.Http({
	baseUrl: 'https://solidtorrents.net/api/v1',
	query: {
		category: 'Video',
	} as Partial<Query>,
	afterResponse: {
		append: [
			async (options, resolved) => {
				await utils.pTimeout(CONFIG.throttle)
			},
		],
	},
})

export class SolidTorrents extends scraper.Scraper {
	sorts = ['size']
	async getResults(slug: string, sort: string) {
		let response = (await client.get('/search', {
			query: { sort, q: slug } as Partial<Query>,
			verbose: true,
		})) as Response
		return (response.results || []).map(v => {
			return {
				bytes: v.size,
				date: new Date(v.imported).valueOf(),
				magnet: v.magnet,
				name: v.title,
				seeders: v.swarm.seeders,
			} as scraper.Result
		})
	}
}

export interface Query {
	sort: string
	category: string
	q: string
}

export interface Response {
	hits: number
	results: Result[]
	took: number
}

export interface Result {
	category: string
	created: string
	imported: string
	infohash: string
	lastmod: string
	magnet: string
	processed: boolean
	rating: {
		average: number
		raters: number
		total: number
	}
	removed: boolean
	size: number
	swarm: {
		downloads: number
		leechers: number
		seeders: number
		verified: boolean
	}
	tags: string[]
	title: string
}