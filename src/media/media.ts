import * as _ from 'lodash'
import * as dayjs from 'dayjs'
import * as Memoize from '@/utils/memoize'
import * as omdb from '@/adapters/omdb'
import * as tmdb from '@/adapters/tmdb'
import * as trakt from '@/adapters/trakt'
import * as utils from '@/utils/utils'

export const TYPES = ['movie', 'show', 'season', 'episode', 'person'] as ContentType[]
export const MAIN_TYPES = ['movie', 'show'] as MainContentType[]
export const TYPESS = ['movies', 'shows', 'seasons', 'episodes', 'people'] as ContentTypes[]
export const MAIN_TYPESS = ['movies', 'shows'] as MainContentTypes[]

export interface Item extends trakt.Extras {}
@Memoize.Class
export class Item {
	movie: trakt.Movie & tmdb.Movie
	show: trakt.Show & tmdb.Show
	season: trakt.Season & tmdb.Season
	episode: trakt.Episode & tmdb.Episode
	person: trakt.Person & tmdb.Person

	get full() {
		return _.merge({}, ...TYPES.map(v => this[v])) as Full
	}
	get main() {
		if (this.movie) return this.movie
		if (this.show) return this.show
		return this.full
	}
	get type() {
		return MAIN_TYPES.find(type => !!this[type])
	}
	get ids() {
		return this.main.ids
	}
	get title() {
		return this.main.title
	}
	get slug() {
		return this.ids.slug
	}
	get short() {
		return `${this.slug} ${this.show ? `(${this.count})` : ''}`.trim()
	}
	get queries() {
		let queries = [this.title]
		if (utils.equals(this.title, this.slug)) {
			queries.push(`${this.title} ${this.year}`)
		}
		if (this.alias && !this.isPopular()) {
			queries.push(this.alias)
		}
		return queries
	}

	get traktId() {
		if (_.has(this.ids, 'trakt')) return this.ids.trakt.toString()
		if (_.has(this.ids, 'imdb')) return this.ids.imdb
		if (_.has(this.ids, 'slug')) return this.ids.slug
		return ''
	}
	get year() {
		if (_.isFinite(this.main.year)) return this.main.year
		if (_.has(this.movie, 'released')) return dayjs(this.movie.released).year()
		if (_.has(this.show, 'first_aired')) return dayjs(this.show.first_aired).year()
		return NaN
	}
	get released() {
		let released = new Date(new Date().setFullYear(this.year))
		if (_.has(this.movie, 'released')) released = new Date(this.movie.released)
		if (_.has(this.show, 'first_aired')) released = new Date(this.show.first_aired)
		return released
	}
	get runtime() {
		if (_.has(this.movie, 'runtime')) return this.movie.runtime
		if (_.has(this.show, 'runtime')) return this.show.runtime
		return Infinity
	}
	get count() {
		return this.show ? this.show.aired_episodes : this.isReleased ? 1 : 0
	}

	get isEnglish() {
		return _.has(this.main, 'language') && (this.main.language || '').includes('en')
	}
	get isReleased() {
		return this.released.valueOf() < Date.now()
	}
	get hasRuntime() {
		return this.runtime >= 10
	}
	isPopular(votes = 500) {
		let months = (Date.now() - this.released.valueOf()) / utils.duration(1, 'month')
		let penalty = 1 - _.clamp(_.ceil(months), 1, 12) / 12
		votes -= _.ceil(votes * 0.5 * penalty)
		return _.has(this.main, 'votes') ? this.main.votes >= votes : false
	}
	isJunk(votes = 1000) {
		let valid = this.isEnglish && this.isReleased && this.hasRuntime && this.isPopular(votes)
		return !(valid && !!this.main.year && !!this.ids.slug && !!this.ids.imdb && !!this.ids.tmdb)
	}

	get isDaily() {
		return this.main.genres.filter(v => ['news', 'reality', 'talk-show'].includes(v)).length > 0
	}

	/** season */
	get S() {
		let S = {
			/** season `aired episodes` */ a: NaN,
			/** season `episode count` */ e: NaN,
			/** season `title` */ t: '',
			/** season `number` */ n: NaN,
			/** season `0 number` */ z: '',
		}
		if (_.has(this.season, 'aired_episodes')) S.a = this.season.aired_episodes
		if (_.has(this.season, 'episode_count')) S.e = this.season.episode_count
		if (_.has(this.season, 'title')) S.t = this.season.title
		if (_.has(this.season, 'number')) S.n = this.season.number
		else if (_.has(this.episode, 'season')) S.n = this.episode.season
		if (_.isFinite(S.n)) S.z = utils.zeroSlug(S.n)
		return S
	}

	/** episode */
	get E() {
		let E = {
			/** episode `aired date` */ a: '',
			/** episode `title` */ t: '',
			/** episode `number` */ n: NaN,
			/** episode `0 number` */ z: '',
		}
		if (_.has(this.episode, 'first_aired')) {
			E.a = dayjs(this.episode.first_aired).format('YYYY-MM-DD')
		}
		if (_.has(this.episode, 'title')) {
			E.t = this.episode.title
			if (this.isDaily) {
				let t = utils.toSlug(E.t).split(' ')
				E.t = `${t[0]} ${t[1]}`
			}
		}
		if (_.has(this.episode, 'number')) {
			E.n = this.episode.number
			E.z = utils.zeroSlug(E.n)
		}
		return E
	}

	aliases: string[]
	get alias() {
		return _.isArray(this.aliases) && this.aliases[0]
		// return this.aliases.sort((a, b) => b.length - a.length)[0]
	}
	async setAliases() {
		if (_.isArray(this.aliases)) return
		let response = (await trakt.client.get(`/${this.type}s/${this.slug}/aliases`, {
			silent: true,
		})) as trakt.Alias[]
		let aliases = response.filter(v => ['gb', 'us'].includes(v.country)).map(v => v.title)
		aliases = aliases.filter(v => !utils.isForeign(v))
		aliases = aliases.filter(v => !utils.equals(v, this.title))
		aliases = aliases.filter(v => !utils.equals(v, this.slug))
		aliases = aliases.filter(v => !utils.includes(v, this.year.toString()))
		aliases = aliases.filter(v => utils.includes(v, this.title))
		aliases = aliases.filter(v => utils.accuracy(v, '3d').length > 0)
		this.aliases = _.uniq(aliases)
		// if (this.aliases.length > 0) console.log(`aliases '${this.slug}' ->`, this.aliases)
	}

	omdb: omdb.Full
	async setOmdb() {
		this.omdb = (await omdb.client.get('/', {
			query: { i: this.ids.imdb },
			silent: true,
		})) as omdb.Full
	}

	tmdb: tmdb.Full
	collection: tmdb.Collection
	async setTmdb() {
		let type = this.show ? 'tv' : 'movie'
		this.tmdb = (await tmdb.client.get(`/${type}/${this.ids.tmdb}`, {
			silent: true,
		})) as tmdb.Full
		if (this.tmdb.belongs_to_collection) {
			let id = this.tmdb.belongs_to_collection.id
			this.collection = (await tmdb.client.get(`/collection/${id}`)) as tmdb.Collection
		}
	}

	async setAll() {
		await Promise.all([await this.setAliases(), await this.setOmdb(), await this.setTmdb()])
		Memoize.clear(this)
	}

	// get titles() {
	// 	return _.uniq([this.title, this.omdb.Title, this.tmdb.name].filter(Boolean)).sort()
	// }
	get years() {
		let tmdbyear = dayjs(this.tmdb.release_date).year()
		return _.uniq([this.year, _.parseInt(this.omdb.Year), tmdbyear].filter(Boolean)).sort()
	}
	// get slugs() {
	// 	let slugs = [] as string[]
	// 	this.titles.forEach(title => this.years.forEach(year => slugs.push(`${title} ${year}`)))
	// 	return _.uniq(slugs)
	// }

	constructor(result: PartialDeep<trakt.Result & tmdb.Result>) {
		this.use(result)
	}

	use(result: PartialDeep<trakt.Result & tmdb.Result>) {
		let picked = _.pick(result, TYPES)
		_.merge(this, picked)
		for (let [rkey, rvalue] of Object.entries(_.omit(result, TYPES))) {
			let ikey = trakt.RESULT_ITEM[rkey]
			if (ikey) this[ikey] = rvalue
		}
		Memoize.clear(this)
		return this
	}
}

export type ContentType = 'movie' | 'show' | 'season' | 'episode' | 'person'
export type MainContentType = 'movie' | 'show'
export type ContentTypes = 'movies' | 'shows' | 'seasons' | 'episodes' | 'people'
export type MainContentTypes = 'movies' | 'shows'
export type Full = typeof Item.prototype.movie &
	typeof Item.prototype.show &
	typeof Item.prototype.season &
	typeof Item.prototype.episode &
	typeof Item.prototype.person
