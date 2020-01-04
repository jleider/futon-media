import * as _ from 'lodash'
import * as http from '@/adapters/http'
import * as media from '@/media/media'
import * as pAll from 'p-all'
import * as utils from '@/utils/utils'

export const client = new http.Http({
	baseUrl: 'https://api.simkl.com',
	query: {
		client_id: process.env.SIMKL_ID,
		client_secret: process.env.SIMKL_SECRET,
		extended: 'full',
	},
})

export async function titles(queries: string[]) {
	let combos = queries.map(v => ['movie', 'tv'].map(vv => [v, vv])).flat()
	let results = (
		await pAll(
			combos.map(([query, type], i) => async () => {
				if (i > 0) await utils.pRandom(300)
				return (await client.get(`/search/${type}`, {
					query: { q: query, limit: 50 },
					memoize: true,
					silent: true,
				})) as Result[]
			}),
			{ concurrency: 2 },
		)
	).flat()
	results = _.uniqBy(results, 'ids.simkl_id').filter(v => !!v.title && !!v.year)
	return results.map(v => ({ title: v.title, year: v.year }))
}

// if (process.DEVELOPMENT) {
// 	process.nextTick(async () => {
// 		let results = await client.get('/search/anime', { query: { q: 'the body', limit: 50 } })
// 		global.dts(results, `results`)
// 	})
// }

export interface Result {
	all_titles: string[]
	ep_count: number
	ids: {
		simkl_id: number
		slug: string
	}
	poster: string
	rank: any
	ratings: {
		imdb: {
			rating: number
			votes: number
		}
		simkl: {
			rating: number
			votes: number
		}
	}
	title: string
	url: string
	year: number
}
