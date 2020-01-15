import * as magnetlink from '@/shims/magnet-link'
import * as parser from '@/scrapers/parser'

export abstract class Debrid<Transfer = any> {
	abstract getFiles(isHD: boolean): Promise<File[]>
	abstract streamUrl(file: File): Promise<string>

	files = [] as File[]
	protected dn: string
	protected infoHash: string
	protected magnet: string

	use(magnet: string) {
		this.magnet = magnet
		let { dn, infoHash } = magnetlink.decode(this.magnet)
		Object.assign(this, { dn, infoHash: infoHash.toLowerCase() })
		return this
	}
}

export interface File {
	bytes: number
	id: number
	levens: number
	link: string
	name: string
	parsed: parser.Parser
	path: string
}
