import { Telegraf, session, Stage} from "telegraf";
import { SceneContextMessageUpdate } from 'telegraf/typings/stage'
import dotenv from 'dotenv';
import procces from 'process';
import { Order } from "./entities/order.entity";
import { Product } from "./entities/product.entity";
import { User } from "./entities/user.entity";
import { Buttons } from "./keyboard/buttons";
import { Action } from "./constants/actions";
import { LoginController } from './controllers/login.controller'
import { ConnectionOptions, createConnection } from "typeorm";
import { OrderController } from "./controllers/order.controller";
import { UserController } from "./controllers/user.controller";

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

        bot.hears(/\/c/, async (ctx: any) => {
            const msg = ctx.message.text
            let orderId = ctx.message.text
            orderId = Number(orderId.substring(2, 5))
            if (ctx.chat.id > 0) {
                const products = await this.userController.sendProductByQuery(orderId)
                return await ctx.replyWithHTML(products)
            }

            if (ctx.chat.id < 0) {
                const products = await this.userController.findProductByOrderId(orderId)

                return await ctx.telegram.sendMessage('-1001223826227', products,
                this.buttons.ACTION_TO_PRODUCT())
            }
        })

        bot.hears(/\/d/, async (ctx: any) => {
            let orderId = ctx.message.text;
            orderId = Number(orderId.substring(2, 5))

            ctx.reply(`Подтверждение на удаление заказа №${orderId}`,
            this.buttons.ACCEPT_DELETE())
        })

        bot.action('✔️ Принять', async (ctx: any) => {
            const msg = ctx.callbackQuery.message.text
            let uid = msg.substring(msg.indexOf('-') + 1)
            let order_id = Number(msg.substring(msg.indexOf('+') + 1))
            
            
            await this.userController.updateStatusAccept(order_id)
            await ctx.answerCbQuery('Заказ принят')
            await ctx.telegram.sendMessage(uid, `Обновляю статус заказов. . .\nПродавец принял ваш заказ №${order_id}`,
            this.buttons.ACCEPT_ORDER())
            
            await ctx.pinChatMessage(ctx.callbackQuery.message.message_id)
        })

        bot.action('❌ Отменить', (ctx: any) => {
            const msg = ctx.callbackQuery.message.text
            const user_id = msg.substring(msg.indexOf('-') + 1)
            ctx.reply(`Выберите причину отмены заказа\n\nЗаказчик:\nID пользователя: -${user_id}`,
            this.buttons.DENY_ORDER())

            ctx.answerCbQuery('Заказ отменён')
        })

        bot.action(Action.INCORRECT_NAME, (ctx: any) => {
            const msg = ctx.callbackQuery.message.text
            const order_id = Number(msg.substring(msg.indexOf('+') + 1))
            const uid = msg.substring(msg.indexOf('-') + 1)
        
            this.userController.updateStatusDeny(order_id)
        
            ctx.answerCbQuery('Заказ отменён')
            ctx.telegram.sendMessage(uid, 'Продавец отменил ваш заказ по причине:\n "Некорректное название товара"')
        })

        bot.action(Action.INCORRECT_VALUE, (ctx: any) => {
            const msg = ctx.callbackQuery.message.text
            const user_id = msg.substring(msg.indexOf('-') + 1)
            const order_id = Number(msg.substring(msg.indexOf('+') + 1))
        
            this.userController.updateStatusDeny(order_id)
        
            ctx.answerCbQuery('Заказ отменён')
            ctx.telegram.sendMessage(user_id, 'Продавец отменил ваш заказ по причине:\n "Некорректное кол-во товара"')
        })

        bot.action('📦 Готов к выдаче', async (ctx: any) => {
            const msg = ctx.callbackQuery.message.text
            let uid = msg.substring(msg.indexOf('-') + 1)
            let order_id = Number(msg.substring(msg.indexOf('+') + 1))
            
            await this.userController.updateStatusReady(order_id)
            await ctx.answerCbQuery('Заказ готов к выдаче')
            await ctx.telegram.sendMessage(uid, 'Продавец готов выдать товар\nОбновляю статус заказов. . .')
        })

        bot.action('Да, удалить', async (ctx: any) => {
            const msg = ctx.callbackQuery.message.text
            let orderId = Number(msg.substring(msg.indexOf('№') + 1))
            await this.userController.deleteOrder(orderId)
            await ctx.reply('Заказ успешно удалён')
        })

        bot.action('Отменить', ctx => {
            ctx.reply('Удаление заказа отменено')
        })

        bot.action(Action.ACCEPTED, (ctx: any) => {
            const msg = ctx.callbackQuery.message.text
            let order_id = Number(msg.substring(msg.indexOf('№') + 1))
            ctx.telegram.sendMessage('-1001223826227', `Заказчик: ${ctx.chat.first_name}\nПринял заказ №${order_id}`)
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