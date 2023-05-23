import installer from '@ffmpeg-installer/ffmpeg'
import axios from 'axios'
import Ffmpeg from 'fluent-ffmpeg'
import { createWriteStream } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { removeFile } from './utils.js'

const __dirname = dirname(fileURLToPath(import.meta.url)) // определили корневой папкой src

class OggConverter {
	constructor() {
		Ffmpeg.setFfmpegPath(installer.path)
	}

	toMp3(input, output) {
		try {
			const outputPath = resolve(dirname(input), `${output}.mp3`)
			return new Promise((resolve, reject) => {//ЛОГИКА ПО ТРАНСФОРМАЦИИ ogg в mp3
				Ffmpeg(input)
					.inputOption('-t 30')
					.output(outputPath)
					.on('end', () => {
						removeFile(input)
						resolve(outputPath)
					})
					.on('error', (err) => reject(err.message))
					.run()
			})
		} catch (e) {
			console.log('Ошибка создания mp3 файла', e.message)
		}
	}

	async create(url, filename) {
		try {
			const oggPath = resolve(__dirname, '../voices', `${filename}.ogg`)//закидываем каждое голосовое в папку Voice
			const response = await axios({
				method: 'get',
				url,
				responseType: 'stream',
			})
			return new Promise((resolve) => {
				const stream = createWriteStream(oggPath)
				response.data.pipe(stream)
				stream.on('finish', () => resolve(oggPath))
			})
		} catch (e) {
			console.log('Не смог закинуть в папку голосовое', e.message);
		}
	}
}

export const ogg = new OggConverter()