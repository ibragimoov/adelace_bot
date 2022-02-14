import { Telegraf, Markup, session, Stage} from "telegraf";
import { SceneContextMessageUpdate } from 'telegraf/typings/stage'
import dotenv from 'dotenv';
import procces from 'process';
import { Order } from "./entities/order.entity";
import { Product } from "./entities/product.entity";
import { User } from "./entities/user.entity";
import { Buttons } from "./keyboard/buttons";
import { Action } from "./constants/actions";
import { LoginController } from './controllers/login.controller'
import moment from "moment";
import typeorm, { ConnectionOptions, createConnection, getMongoRepository } from "typeorm";
import { OrderController } from "./controllers/order.controller";
import { UserController } from "./controllers/user.controller";
import { connection } from "mongoose";

dotenv.config();

const connect = () => {
    const options: ConnectionOptions = {
        type: "mongodb",
        url: procces.env.DB_URL,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        synchronize: true,
        logging: true,
        entities: [
            Order,
            Product,
            User
        ],
    }

    return createConnection(options)
  }

class Bot {
    private loginController = new LoginController()
    private orderController = new OrderController()
    private userController = new UserController()
    private buttons = new Buttons()

    constructor() {
        this.startPolling()
        .then(() => console.log('Bot started :)'))
        .catch((error: any) => console.log(error))
    }

    startPolling = async() => {
        const bot = new Telegraf<SceneContextMessageUpdate>(process.env.BOT_TOKEN as string);

        const loginScene = this.loginController.login()
        const orderScene = this.orderController.makeOrder()

        const stage = new Stage (
            [
                loginScene,
                orderScene,
            ]
        );

        bot.use(session());
        bot.use(stage.middleware())

        bot.start((ctx: any) => {
            try {
                if (ctx.chat.type == 'private') {
                    ctx.reply(`Здравствуйте, ${ctx.chat.first_name}`, 
                        this.buttons.SET_AUTH()
                    );
                } else {
                    ctx.reply(`Бот запущен в группе - ${ctx.chat.id}`)
                }
            } catch (e) {
                console.log(e);
            }
        });

        bot.hears(Action.LOGIN, (ctx: any) => {
            ctx.scene.enter('loginScene')
        })

        bot.hears(Action.BACK, (ctx: any) => {
            ctx.scene.leave();
            ctx.reply(`Здравствуйте, ${ctx.chat.first_name}`, 
                this.buttons.SET_AUTH()
            );
        })

        bot.hears(Action.MAKE_ORDER, (ctx: any) => {
            ctx.scene.enter('makeOrder')
        })

        bot.hears(Action.FAQ, async (ctx: any) => {
            await ctx.replyWithPhoto({url: 'https://sun9-36.userapi.com/impg/u-4a-1vB1cOaiO0FtLJ3l1SvQjfLFYItSxmHiw/x6Joh4eHV4Y.jpg?size=609x471&quality=96&sign=e7553e7be1256d84f6b65a683d18f04f&type=album'});
            await ctx.reply('Команда разработчиков состоит из двух человек\nЕсли увидите ошибки, пишите сюда: help@mail.ru\n\nДанный бот является посредником между покупателем и продавцом\n\n');
        })

        bot.hears(Action.MAIN_MENU, (ctx: any) => {
            ctx.reply('Главное меню',
            this.buttons.SET_MAIN_MENU())
        })

        bot.hears(Action.VIEW_ORDERS, async (ctx: any) => {
            const user = await this.userController.findUserByChatId(ctx.chat.id)
            const orders = await this.userController.findOrderByUser(user)
            ctx.replyWithHTML(orders)
        })

        bot.hears(Action.BUTTON_MAIN_MENU, (ctx: any) => {
            ctx.reply('Привет дружище', 
            this.buttons.MAIN_MENU())
            return ctx.scene.leave()
        })

        bot.hears(/c/, async (ctx: any) => {
            let orderId = ctx.message.text;
            const uid = ctx.message.from.id
            const user = await this.userController.findUserByChatId(uid)
            orderId = Number(orderId.substring(2, 5))
            if (ctx.chat.id > 0) {
                const products = await this.userController.sendProductByQuery(orderId)
                return await ctx.replyWithHTML(products)
            }

            if (ctx.chat.id < 0) {
                const products = await this.userController.findProductByOrderId(user, orderId)

                return await ctx.telegram.sendMessage('-1001223826227', products,
                this.buttons.ACTION_TO_PRODUCT())
            }
        })

        bot.hears(/d/, async (ctx: any) => {
            let orderId = ctx.message.text;
            orderId = orderId.substring(2, 5);
            const orderRep = typeorm.getMongoRepository(Order, 'adelace')

            ctx.reply(`Подтверждение на удаление заказа №${orderId}`, 
            Markup.inlineKeyboard(
                [
                    [
                        {text: 'Да, удалить', callback_data: 'Да, удалить'}, {text: 'Отменить', callback_data: 'Отменить'}
                    ]
                ]
            ))
        })

        bot.action('✔️ Принять', (ctx: any) => {
            const orderRep = typeorm.getMongoRepository(Order, "adelace")
            const msg = ctx.callbackQuery.message.text
            let user_id = msg.substring(msg.indexOf('-') + 1)
            let order_id = msg.substring(msg.indexOf('+') + 1)
            
            if (ctx.from.id == 258752149) {
                ctx.answerCbQuery('Заказ принят')
                ctx.telegram.sendMessage(user_id, `Обновляю статус заказов. . .\nТорговец принял ваш заказ №${order_id}`,
                Markup.inlineKeyboard(
                    [
                        {text: 'Окей, принял!', callback_data: 'Окей, принял!'}
                    ]
                ))

                orderRep.updateMany({orderId: Number(order_id)},
                    {
                        $set: {
                            status: 'В обработке',
                            updatedAt: new Date()
                        }
                    })
                
                ctx.pinChatMessage(ctx.callbackQuery.message.message_id)

            } else {
                ctx.answerCbQuery('Ты не торговец', ctx.from.id)
                ctx.reply(`${ctx.from.first_name}, Ты не торговец`)
            }
        })

        bot.action('❌ Отменить', (ctx: any) => {
            const msg = ctx.callbackQuery.message.text
            const user_id = msg.substring(msg.indexOf('-') + 1)

            if (ctx.from.id == 258752149) {
                ctx.answerCbQuery('Заказ отменён')
                ctx.telegram.sendMessage(user_id, 'Торговец отменил ваш заказ')
            } else {
                ctx.answerCbQuery('Ты не торговец', ctx.from.id)
                ctx.reply(`${ctx.from.first_name}, Ты не торговец`)
            }
        })

        bot.action('📦 Готов к выдаче', (ctx: any) => {
            const orderRep = typeorm.getMongoRepository(Order, "adelace")
            const msg = ctx.callbackQuery.message.text
            let user_id = msg.substring(msg.indexOf('-') + 1)
            let order_id = msg.substring(msg.indexOf('+') + 1)
            
            if (ctx.from.id == 258752149) {
                ctx.answerCbQuery('Заказ готов к выдаче')
                ctx.telegram.sendMessage(user_id, 'Торговец готов выдать товар\nОбновляю статус заказов. . .')

                orderRep.updateMany({orderId: Number(order_id)},
                    {
                        $set: {
                            status: 'Готов к выдаче',
                            updatedAt: new Date()
                        }
                    })

            } else {
                ctx.answerCbQuery('Ты не торговец', ctx.from.id)
                ctx.reply(`${ctx.from.first_name}, Ты не торговец`)
            }
        })

        bot.action('Да, удалить', (ctx: any) => {
            const msg = ctx.callbackQuery.message.text
            const orderRep = typeorm.getMongoRepository(Order, 'adelace')
            let orderId = msg.substring(msg.indexOf('№') + 1)
            orderRep.findOneAndDelete({orderId: Number(orderId)})
            ctx.reply('Заказ успешно удалён')
        })

        bot.action('Отменить', ctx => {
            ctx.reply('Удаление заказа отменено')
        })

        bot.action('Окей, принял!', (ctx: any) => {
            const msg = ctx.callbackQuery.message.text
            let order_id = msg.substring(msg.indexOf('№') + 1)
            ctx.telegram.sendMessage('-1001756421815', `Заказчик: ${ctx.chat.first_name}\nПринял заказ №${order_id}`)
        })

        bot.help((ctx) => ctx.reply('Send me a sticker'));
        bot.on('sticker', (ctx) => ctx.reply('👍'));
        bot.hears('hi', (ctx: any) => {
            ctx.reply(`${ctx.message.text}`)
        }); 

        await bot
        .launch()
    }
}

connect()
  .then(() => {
    console.log('Connected to database')
    new Bot()
  })
  .catch((error) => console.log('Connect failed, error:', error))