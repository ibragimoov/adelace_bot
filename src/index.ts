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
// import orderScene from './controllers/order.controller.js';
// import sendOrdersScene from './controllers/sendOrders.controller.js'
import moment from "moment";
import typeorm, { ConnectionOptions, createConnection } from "typeorm";

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
    private buttons = new Buttons()

    constructor() {
        this.startPolling()
        .then(() => console.log('Bot started :)'))
        .catch((error: any) => console.log(error))
    }

    startPolling = async() => {
        const bot = new Telegraf<SceneContextMessageUpdate>(process.env.BOT_TOKEN as string);

        const loginScene = this.loginController.login()

        const stage = new Stage (
            [
                loginScene,
                // orderScene,
                // sendOrdersScene
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

        bot.hears(Action.SEND_ORDER_FOR_SELLERS, (ctx: any) => {
            ctx.scene.enter('sendOrdersScene')
        })

        bot.hears(Action.MAKE_ORDER, (ctx: any) => {
            ctx.scene.enter('orderScene')
        })

        bot.hears(Action.FAQ, async (ctx: any) => {
            await ctx.replyWithPhoto({url: 'https://sun9-36.userapi.com/impg/u-4a-1vB1cOaiO0FtLJ3l1SvQjfLFYItSxmHiw/x6Joh4eHV4Y.jpg?size=609x471&quality=96&sign=e7553e7be1256d84f6b65a683d18f04f&type=album'});
            await ctx.reply('Команда разработчиков состоит из двух человек\nЕсли увидите ошибки, пишите сюда: help@mail.ru\n\nДанный бот является посредником между покупателем и продавцом\n\n');
        })

        bot.hears(Action.MAIN_MENU, (ctx: any) => {
            ctx.reply('Главное меню',
            Markup.keyboard(this.buttons.MAIN_MENU())
            .resize())
        })

        bot.hears(Action.VIEW_ORDERS, async (ctx: any) => {
            const chatId = ctx.chat.id
            sendOrderByQuery(ctx, chatId)
        })

        bot.hears(Action.BUTTON_MAIN_MENU, (ctx: any) => {
            ctx.reply('Привет дружище', 
            Markup.keyboard(this.buttons.MAIN_MENU())
            .resize());
            return ctx.scene.leave()
        })

        // bot.hears(/c/, async (ctx: any) => {
        //     let orderId = ctx.message.text;
        //     orderId = orderId.substring(2, 5);
        //     const productRep = typeorm.getMongoRepository(Product, 'adelace')
        //     if (ctx.chat.id > 0) {
        //         sendProductByQuery(ctx, orderId)
        //     }

        //     if (ctx.chat.id < 0) {
        //         let html;
        //         productRep.find({orderId: Number(orderId)}).then(async product => {
        //             let count = 0,
        //             user_id;
        //             html = product.map ((f: any, _i) => {
        //                 count++;
        //                 user_id = f.chatId
        //                 return `=========================\n 📦Товар: ${f.nameProduct}\n ⚖️Количество: ${f.value}`;
        //             }).join('\n');

        //             html += `\n=========================\n\nID клиента: -${user_id}\nID заказа: +${orderId}`

        //             return await ctx.telegram.sendMessage('-1001756421815', html,
        //             Markup.inlineKeyboard(
        //                 [
        //                     [
        //                         {text: '✔️ Принять', callback_data: '✔️ Принять'}, {text: '❌ Отменить', callback_data: '❌ Отменить'}
        //                     ],
        //                     [
        //                         {text: '📦 Готов к выдаче', callback_data: '📦 Готов к выдаче'}
        //                     ]
        //                 ]
        //             ))
        //         });
        //     }
        // })

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

        async function sendOrderByQuery(ctx: any, chatId: number) {
            let html;
            const orderRep = await typeorm.getMongoRepository(Order, 'adelace')

            orderRep.count({chatId: ctx.from.id})
            .then((count: any) => {
                if (count == 0) {
                    ctx.reply('Нет заказов');
                }
                else {
                    orderRep.find({ where: { chatId: chatId } }).then(async (orders) => {
                        let count = 0;
                        html = orders.map((f: any, i) => {
                            count++;
                            return `=============================\n <b>Заказ #${i + 1}</b>\n <b>✅Статус:</b> ${f.status}\n <b>📅Обновлено:</b> ${moment(f.updatedAt).format('DD.MM.YYYY, HH:mm')}\n <b>🔎Подробнее:</b> /c${f.orderId}\n\n <b>❎Удалить: /d${f.orderId}</b>`;
                        }).join('\n');

                        html += `\n=============================\n\n<b><i>📮Всего заказов:</i></b> ${count}`;
                        await ctx.replyWithHTML(html);
                    }).catch((e) => {
                        console.log(e);
                    });
                }
            })
            .catch((error) => {
                console.log(error)
            })
        }

        function sendProductByQuery(ctx: any, orderId: any) {
            let html;
            const productRep = typeorm.getMongoRepository(Product, "adelace")
            productRep.find({where: {orderId: Number(orderId)}}).then(async product => {
                let count = 0;
                html = product.map ((f: any, _i) => {
                    count++;
                    return `===================\n <b>📦Товар:</b> ${f.nameProduct}\n <b>⚖️Кол-во:</b> ${f.value}`;
                }).join('\n');

                html += `\n===================\n\n<b><i>🧺Всего товаров:</i></b> ${count}`
                await ctx.replyWithHTML(html)
            });
        }

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