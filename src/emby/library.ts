import * as _ from 'lodash'
import * as emby from '@/emby/emby'
import * as fs from 'fs-extra'
import * as media from '@/media/media'
import * as pAll from 'p-all'
import * as path from 'path'
import * as qs from 'query-string'
import * as Rx from '@/shims/rxjs'
import * as socket from '@/emby/socket'
import * as utils from '@/utils/utils'

export const rxLibrary = socket.rxSocket.pipe(
	Rx.Op.filter(({ MessageType }) => MessageType == 'LibraryChanged'),
	Rx.Op.map(({ Data }) => Data as LibraryChanged)
)

export const library = {
	async refresh() {
		await emby.client.post(`/Library/Refresh`)
	},
	strmFile(item: media.Item, quality = '' as emby.Quality) {
		let file = path.normalize(process.env.EMBY_LIBRARY || process.cwd())
		file += `/${item.movie ? 'movies' : 'shows'}`
		let year = item.main.year
		let title = utils.toSlug(item.main.title, { toName: true })
		if (item.movie) {
			!year && (year = new Date(item.main.released).getFullYear())
			title += ` (${year})`
			file += `/${title}/${title}`
		} else if (item.episode) {
			!year && (year = new Date(item.main.first_aired).getFullYear())
			file += `/${title} (${year})`
			file += `/Season ${item.S.n}`
			file += `/${title} - S${item.S.z}E${item.E.z}`
			item.episode.title && (file += ` - ${item.episode.title}`)
		} else {
			throw new Error(`toStrm !item -> ${item.title}`)
		}
		quality && (file += ` - ${quality}`)
		file += `.strm`
		let url = `${emby.DOMAIN}:${emby.STRM_PORT}/strm`
		url += `?${qs.stringify(item.full.ids)}`
		return { file, url }
	},
}

export async function addLinks(item: media.Item, links: string[]) {
	// let base = path.join(process.cwd(), 'dist')
	let base = path.normalize(process.env.EMBY_LIBRARY || process.cwd())

	let dir = item.movie ? 'movies' : 'shows'
	if (!(await fs.pathExists(path.join(base, dir)))) {
		throw new Error(`!fs.pathExists(${path.join(base, dir)})`)
	}
	dir += `/${item.ids.slug}`
	item.season && (dir += `/s${item.S.z}`)
	let cwd = path.join(base, dir)
	await fs.ensureDir(cwd)

	await pAll(
		links.map((link, index) => () => {
			let name = `${item.ids.slug}`
			if (item.season) {
				name += `-s${item.S.z}`
				name += `e${utils.zeroSlug(index + 1)}`
			}
			name += `.strm`
			return fs.outputFile(path.join(cwd, name), link)
		})
	)
}

export type Quality = '480p' | '720p' | '1080p' | '4K'

export interface Item {
	BackdropImageTags: string[]
	CanDelete: boolean
	CanDownload: boolean
	Chapters: any[]
	CommunityRating: number
	CriticRating: number
	DateCreated: string
	DisplayPreferencesId: string
	Etag: string
	ExternalUrls: {
		Name: string
		Url: string
	}[]
	GenreItems: {
		Id: number
		Name: string
	}[]
	Genres: string[]
	HasSubtitles: boolean
	Id: string
	ImageTags: {
		Art: string
		Banner: string
		Disc: string
		Logo: string
		Primary: string
		Thumb: string
	}
	IsFolder: boolean
	LocalTrailerCount: number
	LockData: boolean
	LockedFields: any[]
	MediaSources: {
		Container: string
		Formats: any[]
		Id: string
		IsInfiniteStream: boolean
		IsRemote: boolean
		MediaStreams: {
			Codec: any
			DisplayLanguage: any
			DisplayTitle: any
			Index: any
			IsDefault: any
			IsExternal: any
			IsForced: any
			IsInterlaced: any
			IsTextSubtitleStream: any
			Language: any
			Path: any
			SupportsExternalStream: any
			Type: any
		}[]
		Name: string
		Path: string
		Protocol: string
		ReadAtNativeFramerate: boolean
		RequiredHttpHeaders: {}
		RequiresClosing: boolean
		RequiresLooping: boolean
		RequiresOpening: boolean
		Size: number
		SupportsDirectPlay: boolean
		SupportsDirectStream: boolean
		SupportsProbing: boolean
		SupportsTranscoding: boolean
		Type: string
	}[]
	MediaStreams: {
		Codec: string
		DisplayLanguage: string
		DisplayTitle: string
		Index: number
		IsDefault: boolean
		IsExternal: boolean
		IsForced: boolean
		IsInterlaced: boolean
		IsTextSubtitleStream: boolean
		Language: string
		Path: string
		SupportsExternalStream: boolean
		Type: string
	}[]
	MediaType: string
	Name: string
	OfficialRating: string
	OriginalTitle: string
	Overview: string
	ParentId: string
	Path: string
	People: {
		Id: string
		Name: string
		PrimaryImageTag: string
		Role: string
		Type: string
	}[]
	PlayAccess: string
	PremiereDate: string
	PrimaryImageAspectRatio: number
	ProductionLocations: string[]
	ProductionYear: number
	ProviderIds: {
		Imdb: string
		Tmdb: string
		TmdbCollection: string
	}
	RemoteTrailers: {
		Name: string
		Url: string
	}[]
	ServerId: string
	SortName: string
	Studios: {
		Id: number
		Name: string
	}[]
	Taglines: string[]
	Tags: any[]
	Type: string
	UserData: {
		IsFavorite: boolean
		Key: string
		PlayCount: number
		PlaybackPositionTicks: number
		Played: boolean
	}
}

export interface LibraryChanged {
	CollectionFolders: any[]
	FoldersAddedTo: any[]
	FoldersRemovedFrom: any[]
	IsEmpty: boolean
	ItemsAdded: any[]
	ItemsRemoved: any[]
	ItemsUpdated: string[]
}