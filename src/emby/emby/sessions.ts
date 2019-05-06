import * as _ from 'lodash'
import * as dayjs from 'dayjs'
import * as emby from '@/emby/emby'
import * as media from '@/media/media'
import * as Rx from '@/shims/rxjs'
import * as schedule from 'node-schedule'
import * as trakt from '@/adapters/trakt'

export const sessions = {
	async get() {
		let Sessions = (await emby.client.get('/Sessions', { silent: true })) as Session[]
		Sessions = Sessions.filter(({ UserName }) => !!UserName).map(v => new Session(v))
		return Sessions.sort((a, b) => b.Stamp - a.Stamp)
	},
	async byUserId(UserId: string) {
		return (await sessions.get()).find(v => v.UserId == UserId)
	},
	broadcast(message: string) {
		sessions.get().then(exts => exts.forEach(v => v.message(message)))
	},
}

export class Session {
	get IsRoku() {
		return `${this.Client} ${this.DeviceName}`.toLowerCase().includes('roku')
	}
	get Codecs() {
		let { audio, video } = { audio: '', video: '' }

		let cpath = 'Capabilities.DeviceProfile.CodecProfiles'
		let cprofiles = _.get(this, cpath, []) as CodecProfiles[]
		audio += _.join(cprofiles.filter(v => v.Type == 'Audio').map(v => v.Codec), ',')
		video += _.join(cprofiles.filter(v => v.Type == 'Video').map(v => v.Codec), ',')

		let dpath = 'Capabilities.DeviceProfile.DirectPlayProfiles'
		let dprofiles = _.get(this, dpath, []) as DirectPlayProfiles[]
		audio += _.join(dprofiles.map(v => v.AudioCodec).filter(Boolean), ',')
		video += _.join(dprofiles.map(v => v.VideoCodec).filter(Boolean), ',')

		let tpath = 'Capabilities.DeviceProfile.TranscodingProfiles'
		let tprofiles = _.get(this, tpath, []) as TranscodingProfiles[]
		audio += _.join(tprofiles.map(v => v.AudioCodec).filter(Boolean), ',')
		video += _.join(tprofiles.map(v => v.VideoCodec).filter(Boolean), ',')

		return {
			audio: _.uniq(audio.toLowerCase().split(',')).filter(Boolean),
			video: _.uniq(video.toLowerCase().split(',')).filter(Boolean),
		}
	}
	get Channels() {
		let tpath = 'Capabilities.DeviceProfile.TranscodingProfiles'
		let tprofiles = _.get(this, tpath) as TranscodingProfiles[]
		if (!_.isArray(tprofiles)) return 8
		return _.max([2].concat(tprofiles.map(v => _.parseInt(v.MaxAudioChannels))))
	}
	get Quality(): emby.Quality {
		if (this.Channels <= 2) return '1080p'
		let users = ['admin', 'developer', 'robert']
		return users.includes(this.UserName.toLowerCase()) ? '2160p' : '1080p'
	}
	get Stamp() {
		return new Date(this.LastActivityDate).valueOf()
	}
	get Age() {
		return Date.now() - this.Stamp
	}
	get Bitrate() {
		let rate = NaN
		if ((rate = _.get(this, 'Capabilities.DeviceProfile.MaxStreamingBitrate'))) return rate
		if ((rate = _.get(this, 'Capabilities.DeviceProfile.MaxStaticBitrate'))) return rate
		return rate
	}

	get AudioStreamIndex() {
		return _.get(this, 'PlayState.AudioStreamIndex') as number
	}
	get MediaSourceId() {
		return _.get(this, 'PlayState.MediaSourceId') as string
	}
	get PlayMethod() {
		return _.get(this, 'PlayState.PlayMethod') as string
	}
	get PositionTicks() {
		return _.get(this, 'PlayState.PositionTicks') as number
	}
	get IsPlayState() {
		let finite = _.isFinite(this.AudioStreamIndex) && _.isFinite(this.PositionTicks)
		return finite && !!this.MediaSourceId && !!this.PlayMethod
	}
	get Container() {
		return _.get(this, 'NowPlayingItem.Container') as string
	}
	get ItemName() {
		return _.get(this, 'NowPlayingItem.Name') as string
	}
	get StrmPath() {
		return _.get(this, 'NowPlayingItem.Path') as string
	}
	get ItemId() {
		return _.get(this, 'NowPlayingItem.Id') as string
	}
	get IsNowPlaying() {
		return !!this.Container && !!this.ItemName && !!this.StrmPath && !!this.ItemId
	}
	get IsStreaming() {
		return !!this.IsPlayState && !!this.IsNowPlaying
	}

	get Ids() {
		let Ids = _.get(this, 'NowPlayingItem.ProviderIds')
		if (!Ids) return
		Ids = _.mapKeys(Ids, (v, k) => k.toLowerCase())
		return Ids as { imdb: string; tmdb: string; tvdb: string }
	}

	get json() {
		return _.fromPairs(
			_.toPairs({
				Age: this.Age,
				// Ago: `${dayjs(this.LastActivityDate).from(dayjs(this.Stamp + this.Age))}`,
				Channels: this.Channels,
				Client: this.Client,
				DeviceName: this.DeviceName,
				Ids: this.Ids,
				IsStreaming: this.IsStreaming,
				Quality: this.Quality,
				StrmPath: this.StrmPath,
				UserName: this.UserName,
			}).filter(([k, v]) => !_.isNil(v))
		)
	}

	constructor(Session: Session) {
		_.merge(this, Session)
	}

	async Device() {
		return (await emby.client.get(`/Devices/Info`, { query: { Id: this.DeviceId } })) as Device
	}

	async User() {
		return await emby.users.byUserId(this.UserId)
	}

	async Latest() {
		return (await emby.client.get(`/Users/${this.UserId}/Items/Latest`, {
			query: { Limit: 5 },
		})) as emby.Item[]
	}

	async Views() {
		return (await emby.client.get(`/Users/${this.UserId}/Views`)) as emby.View[]
	}

	async Item(ItemId: string) {
		return (await emby.client.get(`/Users/${this.UserId}/Items/${ItemId}`)) as emby.Item
	}

	async item(ItemId: string) {
		let Item = await this.Item(ItemId)
		let pairs = _.toPairs(Item.ProviderIds).map(pair => pair.map(v => v.toLowerCase()))
		pairs.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))[0]
		for (let [provider, id] of pairs) {
			let results = (await trakt.client.get(`/search/${provider}/${id}`)) as trakt.Result[]
			let result = results.length == 1 && results[0]
			!result && (result = results.find(v => v[v.type].ids[provider].toString() == id))
			if (result) return { Item, item: new media.Item(result) }
		}
		throw new Error(`!result`)
	}

	message(data: string | Error) {
		let body = { Text: `✅ ${data}`, TimeoutMs: 5000 }
		if (_.isError(data)) {
			body.Text = `❌ Error: ${data.message}`
			body.TimeoutMs *= 2
		}
		emby.client.post(`/Sessions/${this.Id}/Message`, { body }).catch(_.noop)
	}
}

export interface Session {
	AdditionalUsers: any[]
	AppIconUrl: string
	ApplicationVersion: string
	Capabilities: {
		DeviceProfile: {
			CodecProfiles: CodecProfiles[]
			ContainerProfiles: any[]
			DirectPlayProfiles: DirectPlayProfiles[]
			EnableAlbumArtInDidl: boolean
			EnableMSMediaReceiverRegistrar: boolean
			EnableSingleAlbumArtLimit: boolean
			EnableSingleSubtitleLimit: boolean
			IgnoreTranscodeByteRangeRequests: boolean
			MaxAlbumArtHeight: number
			MaxAlbumArtWidth: number
			MaxStaticBitrate: number
			MaxStaticMusicBitrate: number
			MaxStreamingBitrate: number
			MusicStreamingTranscodingBitrate: number
			RequiresPlainFolders: boolean
			RequiresPlainVideoItems: boolean
			ResponseProfiles: {
				Conditions: any[]
				Container: string
				MimeType: string
				Type: string
			}[]
			SubtitleProfiles: {
				Format: string
				Method: string
			}[]
			SupportedMediaTypes: string
			TimelineOffsetSeconds: number
			TranscodingProfiles: TranscodingProfiles[]
			XmlRootAttributes: any[]
		}
		IconUrl: string
		Id: string
		PlayableMediaTypes: string[]
		PushToken: string
		PushTokenType: string
		SupportedCommands: string[]
		SupportsMediaControl: boolean
		SupportsPersistentIdentifier: boolean
		SupportsSync: boolean
	}
	Client: string
	DeviceId: string
	DeviceName: string
	Id: string
	LastActivityDate: string
	NowPlayingItem: {
		BackdropImageTags: string[]
		Chapters: Function[][]
		CommunityRating: number
		Container: string
		CriticRating: number
		DateCreated: string
		ExternalUrls: Function[][]
		GenreItems: Function[][]
		Genres: string[]
		HasSubtitles: boolean
		Height: number
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
		MediaStreams: Function[][]
		MediaType: string
		Name: string
		OfficialRating: string
		OriginalTitle: string
		Overview: string
		ParentId: string
		Path: string
		PremiereDate: string
		PrimaryImageAspectRatio: number
		ProductionYear: number
		ProviderIds: {
			Imdb: string
			Tmdb: string
			Tvdb: string
		}
		RunTimeTicks: number
		ServerId: string
		Studios: Function[][]
		Taglines: string[]
		Type: string
		Width: number
	}
	PlayState: {
		AudioStreamIndex: number
		CanSeek: boolean
		IsMuted: boolean
		IsPaused: boolean
		MediaSourceId: string
		PlayMethod: string
		PositionTicks: number
		RepeatMode: string
		VolumeLevel: number
	}
	PlayableMediaTypes: string[]
	PlaylistItemId: string
	RemoteEndPoint: string
	ServerId: string
	SupportedCommands: string[]
	SupportsRemoteControl: boolean
	UserId: string
	UserName: string
}

interface CodecProfiles {
	ApplyConditions: any[]
	Codec: string
	Conditions: {
		Condition: any
		IsRequired: any
		Property: any
		Value: any
	}[]
	Type: string
}

interface DirectPlayProfiles {
	AudioCodec: string
	Container: string
	Type: string
	VideoCodec: string
}

interface TranscodingProfiles {
	AudioCodec: string
	BreakOnNonKeyFrames: boolean
	Container: string
	Context: string
	CopyTimestamps: boolean
	EnableMpegtsM2TsMode: boolean
	EstimateContentLength: boolean
	MaxAudioChannels: string
	MinSegments: number
	Protocol: string
	SegmentLength: number
	TranscodeSeekInfo: string
	Type: string
	VideoCodec: string
}

interface Device {
	AppName: string
	AppVersion: string
	DateLastActivity: string
	IconUrl: string
	Id: string
	LastUserId: string
	LastUserName: string
	Name: string
}