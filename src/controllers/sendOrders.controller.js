import { Scenes, Markup } from 'telegraf';
import moment from 'moment';
import typeorm from 'typeorm'
import Users from '../models/user.model.js';
import Order from '../models/order.model.js';

const sendOrdersScene = new Scenes.WizardScene('sendOrdersScene',
    async (ctx) => {
        const userRep = typeorm.getMongoRepository(Users, "adelace")
        const orderRep = typeorm.getMongoRepository(Order, "adelace")

        const user = await userRep.findOne({chatId: ctx.from.id})
        let html,
            text = `\n=========================\n\nЗаказчик:   ${user.name}\nID пользователя: -${ctx.chat.id}\n`

        orderRep.count({chatId: ctx.from.id}, (err, count) => {
            if (count == 0) {
                ctx.reply('Нет заказов для отправки')
                return ctx.scene.leave();
            }
            else {
                orderRep.find({chatId: ctx.from.id, status: 'Новый'}).then(async orders => {
                    let count = 0;
                    html = orders.map ((f, i) => {
                        count++;
                        return `=========================\n Заказ #${i + 1}\n ✅Статус: ${f.status}\n 📅Обновлен: ${moment(f.updatedAt).format('DD.MM.YYYY HH:mm')}\n 🔎Подробнее: /c${f.orderId}`;
                    }).join('\n');
        
                    html += text
                    await ctx.telegram.sendMessage('-1001756421815', html,
                    )
                });

                return ctx.scene.leave();
            }
        })
    })

export default sendOrdersScene;