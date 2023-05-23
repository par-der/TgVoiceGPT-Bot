import config from 'config'
import { createReadStream } from 'fs'
import { Configuration, OpenAIApi } from 'openai'

class OpenAI {
	roles = {
		ASSISTANT: 'assistant',
		USER: 'user',
		SYSTEM: 'system',
	}

	constructor(apiKey) {
		const configuration = new Configuration({
			apiKey,
		})
		this.openai = new OpenAIApi(configuration)
	}

	async chat(messages) {
		try {
			const response = await this.openai.createChatCompletion({
				model: 'gpt-3.5-turbo',
				messages,
			})
			return response.data.choices[0].message //Распаршиваем json и берем от туда 0-й элемент
		} catch (e) {
			console.log('Ошибка ГПТ чата', e.message);
		}
	}

	async transcription(filepath) {// логика по работе с апишкой
		try {
			const response = await this.openai.createTranscription(
				createReadStream(filepath),
				'whisper-1' // модель которая все читает
			)
			return response.data.text
		} catch (e) {
			console.log('Ошибка записи', e.message);
		}
	}
}

export const openai = new OpenAI(config.get('OPENAI_KEY')) 