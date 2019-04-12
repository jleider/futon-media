import * as _ from 'lodash'
import * as tmdb from '@/adapters/tmdb'
import * as trakt from '@/adapters/trakt'

export const MOVIES = {
	'ant-man-and-the-wasp-2018': {
		movie: {
			adult: false,
			backdrop_path: '/6P3c80EOm7BodndGBUAJHHsHKrp.jpg',
			belongs_to_collection: {
				backdrop_path: '/2KjtWUBiksmN8LsUouaZnxocu5N.jpg',
				id: 422834,
				name: 'Ant-Man Collection',
				poster_path: '/tdKbDECJQ3JmYaMubNaKFM1mgcY.jpg',
			},
			budget: 140000000,
			certification: 'PG-13',
			comment_count: 73,
			country: 'us',
			genres: [
				{
					id: 28,
					name: 'Action',
				},
				{
					id: 12,
					name: 'Adventure',
				},
				{
					id: 878,
					name: 'Science Fiction',
				},
				{
					id: 35,
					name: 'Comedy',
				},
				{
					id: 10751,
					name: 'Family',
				},
				'family',
			],
			homepage: 'https://www.marvel.com/movies/ant-man-and-the-wasp',
			id: 363088,
			ids: {
				imdb: 'tt5095030',
				slug: 'ant-man-and-the-wasp-2018',
				tmdb: 363088,
				trakt: 223262,
			},
			imdb_id: 'tt5095030',
			language: 'en',
			original_language: 'en',
			original_title: 'Ant-Man and the Wasp',
			overview:
				'Just when his time under house arrest is about to end, Scott Lang once again puts his freedom at risk to help Hope van Dyne and Dr. Hank Pym dive into the quantum realm and try to accomplish, against time and any chance of success, a very dangerous rescue mission.',
			popularity: 52.48,
			poster_path: '/rv1AWImgx386ULjcf62VYaW8zSt.jpg',
			production_countries: [
				{
					iso_3166_1: 'US',
					name: 'United States of America',
				},
			],
			rating: 7.52116,
			release_date: '2018-07-04',
			released: '2018-07-06',
			revenue: 622379576,
			runtime: 119,
			spoken_languages: [
				{
					iso_639_1: 'en',
					name: 'English',
				},
			],
			status: 'Released',
			tagline: 'Real heroes. Not actual size.',
			title: 'Ant-Man and the Wasp',
			trailer: 'http://youtube.com/watch?v=8_rTIAOohas',
			updated_at: '2019-04-06T09:27:17.000Z',
			video: false,
			vote_average: 7,
			vote_count: 5465,
			votes: 16141,
			year: 2018,
		},
		score: 834.1143,
	} as trakt.Result & tmdb.Result,

	'she-s-out-of-my-league-2010': {
		movie: {
			adult: false,
			backdrop_path: '/9Pu4kGTcq7c1bvufK13p5WaHe7K.jpg',
			belongs_to_collection: null,
			budget: 20000000,
			certification: 'R',
			comment_count: 3,
			country: 'us',
			genres: [
				{
					id: 35,
					name: 'Comedy',
				},
				{
					id: 10749,
					name: 'Romance',
				},
			],
			homepage: 'http://www.getyourrating.com/',
			id: 34016,
			ids: {
				imdb: 'tt0815236',
				slug: 'she-s-out-of-my-league-2010',
				tmdb: 34016,
				trakt: 21764,
			},
			imdb_id: 'tt0815236',
			language: 'en',
			original_language: 'en',
			original_title: "She's Out of My League",
			overview:
				"When he starts dating drop-dead gorgeous Molly, insecure airport security agent Kirk can't believe it. As his friends and family share their doubts about the relationship lasting, Kirk does everything he can to avoid losing Molly forever.",
			popularity: 9.875,
			poster_path: '/jtoZLyid2QGjbkuMrQ4cMt8iRFd.jpg',
			production_countries: [
				{
					iso_3166_1: 'US',
					name: 'United States of America',
				},
			],
			rating: 6.81832,
			release_date: '2010-03-11',
			released: '2010-03-12',
			revenue: 49779728,
			runtime: 104,
			spoken_languages: [
				{
					iso_639_1: 'en',
					name: 'English',
				},
			],
			status: 'Released',
			tagline: "When she's this hot, You get one shot.",
			title: "She's Out of My League",
			trailer: 'http://youtube.com/watch?v=oWJJGXvL7PM',
			updated_at: '2019-02-06T08:56:33.000Z',
			video: false,
			vote_average: 6.1,
			vote_count: 936,
			votes: 2631,
			year: 2010,
		},
		score: 7.8510184,
	} as trakt.Result & tmdb.Result,

	// '____': {____} as trakt.Result & tmdb.Result,

	// '____': {____} as trakt.Result & tmdb.Result,

	// '____': {____} as trakt.Result & tmdb.Result,

	// '____': {____} as trakt.Result & tmdb.Result,

	// '____': {____} as trakt.Result & tmdb.Result,
}

export const EPISODES = {
	'game-of-thrones': {
		episode: {
			comment_count: 8,
			first_aired: '2013-04-22T01:00:00.000Z',
			ids: {
				imdb: 'tt2178798',
				tmdb: 63082,
				trakt: 73663,
				tvdb: 4517460,
				tvrage: 1065289512,
			},
			number: 4,
			number_abs: 24,
			overview:
				"Trouble brews among the Night's Watch at Craster's. Margaery takes Joffrey out of his comfort zone. Arya meets the leader of the Brotherhood. Varys plots revenge on an old foe. Theon mournfully recalls his missteps. Daenerys deftly orchestrates her exit from Astapor.",
			rating: 8.55425,
			runtime: 53,
			season: 3,
			title: 'And Now His Watch Is Ended',
			updated_at: '2019-04-07T05:10:35.000Z',
			votes: 9954,
		},
		score: 562.5521,
		season: {
			aired_episodes: 10,
			episode_count: 10,
			first_aired: '2013-04-01T01:00:00.000Z',
			ids: {
				tmdb: 3626,
				trakt: 3965,
				tvdb: 488434,
				tvrage: null,
			},
			network: 'HBO',
			number: 3,
			overview:
				"Duplicity and treachery...nobility and honor...conquest and triumph...and, of course, dragons. In Season 3, family and loyalty are the overarching themes as many critical storylines from the first two seasons come to a brutal head. Meanwhile, the Lannisters maintain their hold on King's Landing, though stirrings in the North threaten to alter the balance of power; Robb Stark, King of the North, faces a major calamity as he tries to build on his victories; a massive army of wildlings led by Mance Rayder march for the Wall; and Daenerys Targaryen--reunited with her dragons--attempts to raise an army in her quest for the Iron Throne.",
			rating: 9.08289,
			title: 'Season 3',
			votes: 2425,
		},
		show: {
			aired_episodes: 67,
			airs: {
				day: 'Sunday',
				time: '21:00',
				timezone: 'America/New_York',
			},
			certification: 'TV-MA',
			comment_count: 296,
			country: 'us',
			first_aired: '2011-04-18T01:00:00.000Z',
			genres: ['drama', 'fantasy', 'science-fiction', 'action', 'adventure'],
			homepage: 'http://www.hbo.com/game-of-thrones',
			ids: {
				imdb: 'tt0944947',
				slug: 'game-of-thrones',
				tmdb: 1399,
				trakt: 1390,
				tvdb: 121361,
				tvrage: 24493,
			},
			language: 'en',
			network: 'HBO',
			overview:
				"Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest north. Amidst the war, a neglected military order of misfits, the Night's Watch, is all that stands between the realms of men and the icy horrors beyond.",
			rating: 9.30097,
			runtime: 60,
			status: 'returning series',
			title: 'Game of Thrones',
			trailer: 'http://youtube.com/watch?v=bjqEWgDVPe0',
			updated_at: '2019-04-06T18:28:59.000Z',
			votes: 89662,
			year: 2011,
		},
	} as trakt.Result & tmdb.Result,

	'the-planets-2017': {
		episode: {
			comment_count: 0,
			first_aired: '2018-08-08T02:00:00.000Z',
			ids: {
				imdb: null,
				tmdb: null,
				trakt: 3107944,
				tvdb: 6782274,
				tvrage: null,
			},
			number: 8,
			number_abs: null,
			overview:
				'Astronaut Mike Massimino reveals the alien secrets of comets, strange visitors from deep space that might be responsible for life on Earth.',
			rating: 8.07143,
			runtime: 43,
			season: 2,
			title: 'Comets: Mysteries from the Deep',
			updated_at: '2019-04-11T04:07:54.000Z',
			votes: 14,
		},
		score: 1000,
		season: {
			aired_episodes: 15,
			episode_count: 15,
			first_aired: '2018-03-21T02:00:00.000Z',
			ids: {
				tmdb: null,
				trakt: 161261,
				tvdb: null,
				tvrage: null,
			},
			network: 'Science Channel',
			number: 2,
			overview: null,
			rating: 9,
			title: 'Season 2',
			votes: 1,
		},
		show: {
			aired_episodes: 23,
			airs: {
				day: 'Tuesday',
				time: '22:00',
				timezone: 'America/New_York',
			},
			certification: null,
			comment_count: 1,
			country: 'us',
			first_aired: '2017-08-23T02:00:00.000Z',
			genres: ['documentary'],
			homepage: 'https://www.sciencechannel.com/tv-shows/the-planets/',
			ids: {
				imdb: 'tt7297802',
				slug: 'the-planets-2017',
				tmdb: 73897,
				trakt: 123034,
				tvdb: 333648,
				tvrage: null,
			},
			language: 'en',
			network: 'Science Channel',
			overview:
				"In conjunction with the first total solar eclipse in the continental U.S. in 99 years, Science Channel celebrates by presenting a definitive series on Earth's closest neighbors in the solar system. Former NASA astronaut Mike Massimino hosts, guiding viewers through eight, hourlong episodes that detail Venus, Mars, the newly discovered Planet 9, Exoplanets and more. A best-selling author, Massimino is a veteran of two missions in the Hubble Space Telescope and four space walks. He's also credited as the first person to tweet from space.",
			rating: 8,
			runtime: 43,
			status: 'returning series',
			title: 'The Planets',
			trailer: null,
			updated_at: '2018-10-23T10:32:38.000Z',
			votes: 8,
			year: 2017,
		},
	} as trakt.Result & tmdb.Result,

	'the-big-bang-theory': {
		episode: {
			comment_count: 4,
			first_aired: '2017-12-01T01:00:00.000Z',
			ids: {
				imdb: 'tt6674486',
				tmdb: 1391231,
				trakt: 2779956,
				tvdb: 6389649,
				tvrage: 0,
			},
			number: 9,
			number_abs: 240,
			overview:
				"Sheldon tries to teach the guys a lesson after they cut him out of a potentially valuable Bitcoin investment. Also, a seven-year-old video reveals a secret about Leonard and Penny's relationship.",
			rating: 7.66962,
			runtime: 19,
			season: 11,
			title: 'The Bitcoin Entanglement',
			updated_at: '2019-04-12T10:41:07.000Z',
			votes: 5536,
		},
		score: 1101.7463,
		season: {
			aired_episodes: 24,
			episode_count: 24,
			first_aired: '2017-09-26T00:00:00.000Z',
			ids: {
				tmdb: 91000,
				trakt: 142214,
				tvdb: 714200,
				tvrage: null,
			},
			network: 'CBS',
			number: 11,
			overview:
				'After years of only looking out for himself, Sheldon found Amy Farrah Fowler to be the most patient woman to ever walk the earth, and... they did it! Wedding fever continues in season 11.',
			rating: 7.71648,
			title: 'Season 11',
			votes: 261,
		},
		show: {
			aired_episodes: 273,
			airs: {
				day: 'Thursday',
				time: '20:00',
				timezone: 'America/New_York',
			},
			certification: 'TV-14',
			comment_count: 212,
			country: 'us',
			first_aired: '2007-09-25T00:00:00.000Z',
			genres: ['comedy'],
			homepage: 'http://www.cbs.com/shows/big_bang_theory/',
			ids: {
				imdb: 'tt0898266',
				slug: 'the-big-bang-theory',
				tmdb: 1418,
				trakt: 1409,
				tvdb: 80379,
				tvrage: 8511,
			},
			language: 'en',
			network: 'CBS',
			overview:
				'A woman who moves into an apartment across the hall from two brilliant but socially awkward physicists shows them how little they know about life outside of the laboratory.',
			rating: 8.22975,
			runtime: 25,
			status: 'returning series',
			title: 'The Big Bang Theory',
			trailer: 'http://youtube.com/watch?v=3g2yTcg1QFI',
			updated_at: '2019-04-12T10:36:08.000Z',
			votes: 51407,
			year: 2007,
		},
	} as trakt.Result & tmdb.Result,

	// '____': {____} as trakt.Result & tmdb.Result,

	// '____': {____} as trakt.Result & tmdb.Result,

	// '____': {____} as trakt.Result & tmdb.Result,

	// '____': {____} as trakt.Result & tmdb.Result,
}

export const SEASONS = _.mapValues(EPISODES, v => _.omit(v, 'episode')) as typeof EPISODES
export const SHOWS = _.mapValues(EPISODES, v => _.omit(v, 'episode', 'season')) as typeof EPISODES
