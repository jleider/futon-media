import * as _ from 'lodash'
import * as advancedFormat from 'dayjs/plugin/advancedFormat'
import * as crypto from 'crypto'
import * as customParseFormat from 'dayjs/plugin/customParseFormat'
import * as dayjs from 'dayjs'
import * as levenshtein from 'js-levenshtein'
import * as matcher from 'matcher'
import * as path from 'path'
import * as pDelay from 'delay'
import * as relativeTime from 'dayjs/plugin/relativeTime'
import fastStringify from 'fast-safe-stringify'
import numbro, { INumbro } from '@/shims/numbro'
import stripBom = require('strip-bom')

dayjs.extend(advancedFormat)
dayjs.extend(customParseFormat)
dayjs.extend(relativeTime)

export function duration(amount: number, unit: dayjs.OpUnitType) {
	let day = dayjs(0).add(amount, unit)
	return day.valueOf()
}

export function hash(value: any) {
	if (!_.isString(value)) value = fastStringify.stable(value)
	let sha256 = crypto.createHash('sha256').update(value)
	return sha256.digest('hex')
}

export function pTimeout<T = void>(ms: number, value?: T): Promise<T> {
	return pDelay(_.ceil(ms), { value })
}
export function pRandom<T = void>(ms: number, value?: T): Promise<T> {
	return pDelay(_.ceil(_.random(ms * Math.E * 0.1, ms)), { value })
}

export function isNumeric(value: string) {
	return !_.isEmpty(value) && !isNaN(value as any)
}
export function parseInt(value: string) {
	return Number.parseInt(value.replace(/[^\d]/g, ''))
}
export function parseFloat(value: string) {
	return Number.parseFloat(value.replace(/[^\d.]/g, ''))
}
export function zeroSlug(value: number) {
	if (!_.isFinite(value)) return 'NaN'
	if (value >= 100) return value.toString()
	return (value / 100).toFixed(2).slice(-2)
}

export function isForeign(value: string) {
	return /[^\x01-\xFF]/gi.test(value) == true
	// return /[^\x00-\x7F]/gi.test(value) == false
	// return /[^\x01-\xFF]/gi.test(value) == false
}
export function isAscii(value: string) {
	return /[^a-z0-9\s]/gi.test(value) == false
}
export function squash(value: string) {
	return trim(clean(value).replace(/[^a-z0-9\s]/gi, ''))
}
export function minify(value: string) {
	value = clean(value).replace(/[^a-z0-9]/gi, '')
	return value.toLowerCase().trim()
}
export function clean(value: string) {
	return trim(stripBom(stripAnsi(_.unescape(_.deburr(value)))))
}
export function stripAnsi(value: string) {
	return value.replace(/\x1B[[(?);]{0,2}(;?\d)*./g, '')
}
export function trim(value: string) {
	return value.replace(/\s+/g, ' ').trim()
}
export function simplify(value: string) {
	return _.filter(value.split(/\s+/), v => isAscii(clean(v).slice(1, -1))).join(' ')
}

export function equals(value: string, target: string) {
	return minify(value) == minify(target)
}
export function includes(value: string, target: string) {
	return minify(value).includes(minify(target))
}
export function startsWith(value: string, target: string) {
	return minify(value).startsWith(minify(target))
}
export function endsWith(value: string, target: string) {
	return minify(value).endsWith(minify(target))
}
export function unique(values: string[]) {
	return _.uniqWith(values, (a, b) => minify(a) == minify(b))
}
export function dedupe(value: string) {
	let words = value.split(/\s+/)
	for (let i = words.length - 1; i >= 0; i--) {
		if (words[i] == words[i - 1]) words.splice(i, 1)
	}
	return words.join(' ')
}

export function contains(value: string, target: string) {
	let values = toSlug(value).split(' ')
	let targets = toSlug(target).split(' ')
	let start = values.findIndex(v => v == targets[0])
	if (start == -1) return false
	for (let i = 0; i < targets.length; i++) {
		if (!equals(targets[i], values[start + i])) return false
	}
	return true
}

/** `accuracies.length == 0` when all of `target` is included in `value` */
export function accuracies(value: string, target: string) {
	let values = _.uniq(toSlug(value).split(' '))
	let targets = _.uniq(toSlug(target).split(' '))
	return targets.filter(v => !values.includes(v))
}
export function accuracy(value: string, target: string) {
	return accuracies(value, target).length == 0
}

/** `levens == 0` when all of `target` is included in `value` */
export function levens(value: string, target: string) {
	value = toSlug(value)
	target = toSlug(target)
	return Math.abs(value.length - target.length - levenshtein(value, target))
}
export function leven(value: string, target: string) {
	return levens(value, target) == 0
}
export { levenshtein }

export function unsquash(value: string) {
	let [a, b] = [toSlug(value), toSlug(value, { squash: true })]
	return a == b ? [a] : [a, b]
}

export const STOPS = ['a', 'an', 'and', 'in', 'of', 'the', 'to']
export function stops(value: string) {
	return _.filter(value.split(/\s+/), v => !STOPS.includes(minify(v))).join(' ')
}

export interface SlugOptions {
	lowercase: boolean
	separator: string
	squash: boolean
	stops: boolean
	title: boolean
}
export function toSlug(value: string, options = {} as Partial<SlugOptions>) {
	_.defaults(options, {
		lowercase: options.title != true,
		separator: ' ',
		squash: options.title == true,
		stops: false,
	} as SlugOptions)
	value = clean(value)
	if (options.squash) value = squash(value)
	let slug = trim(value.replace(/[^a-z0-9\s]/gi, ' '))
	if (options.lowercase) slug = slug.toLowerCase()
	if (options.stops) slug = stops(slug)
	if (options.separator != ' ') slug = slug.replace(/\s/g, options.separator)
	return slug
}

export const VIDEOS = ['avi', 'm4a', 'mkv', 'mov', 'mp4', 'mpeg', 'webm', 'wmv']
export function isVideo(file: string) {
	return VIDEOS.includes(path.extname(file.toLowerCase()).slice(1))
}

export function compact<T = any>(value: T) {
	return (_.fromPairs(_.toPairs(value as any).filter(([k, v]) => !_.isNil(v))) as any) as T
}
export function byLength(values: string[]) {
	return _.sortBy(values).sort((a, b) => a.length - b.length)
}
export function alphabetically(a: string, b: string) {
	a = minify(a)
	b = minify(b)
	return a < b ? -1 : a > b ? 1 : (0 as number)
}

export function slider(value: number, min: number, max: number) {
	if (max - min == 0) return 0
	return ((value - min) / (max - min)) * 100
}

export function dispersed(value: number, index: number, max: number) {
	return Math.round(Math.max(index, 0) * (value / Math.max(max, 1)))
}

export function chunks<T = any>(values: T[], max: number) {
	let size = Math.ceil(values.length / Math.max(max, 1))
	let chunks = Array.from(Array(size), v => []) as T[][]
	values.forEach((v, i) => chunks[i % chunks.length].push(v))
	return chunks
}
export function remove<T>(values: T[], fn: (value: T, index: number, values: T[]) => boolean) {
	for (let i = values.length - 1; i >= 0; i--) {
		if (fn(values[i], i, values)) values.splice(i, 1)
	}
	return values
}
export function uniqBy<T, K extends keyof T>(values: T[], key: K) {
	let keys = new Set()
	let uniqs = [] as T[]
	for (let value of values) {
		if (keys.has(value[key])) continue
		keys.add(value[key])
		uniqs.push(value)
	}
	return uniqs
}
// export function uniqWith<T>(values: T[], fn: (a: T, b: T) => boolean) {}

export function randoms(size: number) {
	return Array.from(Array(size), v => Math.random().toString())
}
export function fill(size: number) {
	return Array.from(Array(size), (v, i) => i)
}
export function nonce() {
	let random = Math.random().toString(36)
	return random.slice(-8)
}

export function defineValue<T, K extends keyof T>(target: T, key: K, value: T[K]) {
	Object.defineProperty(target, key, { value })
}

export function toStamp(value: string) {
	let amount = parseInt(value)
	let unit = value.replace(/[^a-z\s]/gi, '')
	unit = unit.toLowerCase().trim()
	unit = unit.split(' ').shift()
	if (unit.endsWith('s')) unit = unit.slice(0, -1)
	let day = dayjs().subtract(amount, unit as any)
	return day.add(1, 'minute').valueOf()
}

const BYTE_UNITS = {
	b: { num: 1, str: 'B' },
	kb: { num: Math.pow(1000, 1), str: 'KB' },
	mb: { num: Math.pow(1000, 2), str: 'MB' },
	gb: { num: Math.pow(1000, 3), str: 'GB' },
	tb: { num: Math.pow(1000, 4), str: 'TB' },
	pb: { num: Math.pow(1000, 5), str: 'PB' },
	eb: { num: Math.pow(1000, 6), str: 'EB' },
	zb: { num: Math.pow(1000, 7), str: 'ZB' },
	yb: { num: Math.pow(1000, 8), str: 'YB' },
	kib: { num: Math.pow(1024, 1), str: 'KiB' },
	mib: { num: Math.pow(1024, 2), str: 'MiB' },
	gib: { num: Math.pow(1024, 3), str: 'GiB' },
	tib: { num: Math.pow(1024, 4), str: 'TiB' },
	pib: { num: Math.pow(1024, 5), str: 'PiB' },
	eib: { num: Math.pow(1024, 6), str: 'EiB' },
	zib: { num: Math.pow(1024, 7), str: 'ZiB' },
	yib: { num: Math.pow(1024, 8), str: 'YiB' },
}
export function toBytes(value: string) {
	let amount = parseFloat(value)
	let unit = value.replace(/[^a-z]/gi, '').toLowerCase()
	return _.parseInt((amount * BYTE_UNITS[unit].num) as any)
}
export function fromBytes(value: number) {
	let units = Object.entries(BYTE_UNITS).map(([k, v]) => v)
	let unit = units.find(unit => value / unit.num < 1000)
	value = value / unit.num
	return `${value.toFixed([2, 1, 1][value.toFixed(0).length])} ${unit.str}`
}

if (process.DEVELOPMENT) {
	process.nextTick(async () => _.defaults(global, await import('@/utils/utils')))
}
