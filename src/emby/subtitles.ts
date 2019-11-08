import * as _ from 'lodash'
import * as emby from '@/emby/emby'
import * as Rx from '@/shims/rxjs'
import * as utils from '@/utils/utils'

process.nextTick(() => {
	let rxSubtitles = emby.rxItem.pipe(
		Rx.op.filter(({ Item }) => ['Movie', 'Episode'].includes(Item.Type)),
	)
	rxSubtitles.subscribe(async ({ ItemId }) => {
		for (let query of [
			{ IsPerfectMatch: 'false' },
			{ IsPerfectMatch: 'false', IsForced: 'true' },
		]) {
			let subs = (await emby.client.get(`/Items/${ItemId}/RemoteSearch/Subtitles/eng`, {
				query,
				silent: true,
			})) as emby.RemoteSubtitle[]
			if (_.isEmpty(subs)) continue
			await emby.client.post(`/Items/${ItemId}/RemoteSearch/Subtitles/${subs[0].Id}`, {
				silent: true,
			})
		}
	})
})
