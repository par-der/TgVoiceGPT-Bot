import config from 'config'
import { Telegraf, session } from 'telegraf'
import { message } from 'telegraf/filters'
import { code } from 'telegraf/format'
import { ogg } from './ogg.js'
import { openai } from './openai.js'

console.log(config.get('TEST_ENV'))

const INITIAL_SESSION = {
	messages: [],
}

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))//Токен который мы получаем от самого тг

bot.use(session())

bot.command('new', async (ctx) => { //Обратный ответ на сообщение /new(обработка команды)
	ctx.session = INITIAL_SESSION
	await ctx.reply('Жду вашего голосового или текстового сообщения')
})

bot.command('start', async (ctx) => { //Обратный ответ на сообщение /start(обработка команды)
	ctx.session = INITIAL_SESSION
	await ctx.reply('Жду вашего голосового или текстового сообщения')
})

bot.on(message('voice'), async (ctx) => { //Обработчик любого Голосового сообщения
	ctx.session ??= INITIAL_SESSION // примениться если session будет null or undefine 
	try {
		await ctx.reply(code('Сообщение принял. Жду ответ от сервера...'))

		const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
		const userId = String(ctx.message.from.id)
		console.log(link.href)
		const oggPath = await ogg.create(link.href, userId)//сохранение в папке voice ogg голосовое
		const mp3Path = await ogg.toMp3(oggPath, userId)//перевод ogg to mp3 под id пользователя

		const text = await openai.transcription(mp3Path)//Записываем GPT наш вопрос 
		await ctx.reply(code(`Ваш запрос: ${text}`))//Получаем ответ от GPT

		ctx.session.messages.push({role: openai.roles.USER, content: text})

		const response = await openai.chat(ctx.session.messages)
		
		ctx.session.messages.push({
			role: openai.roles.ASSISTANT,
			content: response.content,
		})

		await ctx.reply(response.content)
	} catch(e) {
		console.log('Ошибка: Голос не распознать', e.message);
	} 
})

bot.on(message('text'), async (ctx) => { //Обработчик любого Голосового сообщения
	ctx.session ??= INITIAL_SESSION // примениться если session будет null or undefine 
	try {
		await ctx.reply(code('Сообщение принял. Жду ответ от сервера...'))
		ctx.session.messages.push({role: openai.roles.USER, content: ctx.message.text})
		const response = await openai.chat(ctx.session.messages)
		
		ctx.session.messages.push({
			role: openai.roles.ASSISTANT,
			content: response.content,
		})

		await ctx.reply(response.content)
	} catch(e) {
		console.log('Ошибка: Голос не распознать', e.message);
	} 
})

bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))