import { Buttons } from "../keyboard/buttons";
import { UserController } from "./user.controller";
import { Order } from "../entities/order.entity";

const WizardScene = require("telegraf/scenes/wizard");

export class OrderController {
    private buttons = new Buttons()
    private userController = new UserController()
    private product: any = [];

    makeOrder() {
        return new WizardScene('makeOrder',
        async (ctx: any) => {
            await ctx.reply('Введите название товара. . .',
            this.buttons.BACK_TO_MENU())
            return ctx.wizard.next();
        },
        async (ctx: any) => {
            ctx.wizard.state.chatId = ctx.chat.id;
            ctx.wizard.state.nameOrder = ctx.message.text;
    
            if (await ctx.wizard.state.nameOrder =='👈 в главное меню') {
                ctx.reply('Главное меню', 
                this.buttons.SET_MAIN_MENU());
                for (let member in this.product) delete this.product[member];
                return ctx.scene.leave()
            }

            await ctx.replyWithHTML('Введите количество товара. . .\nНапример: <b><i>5 кг</i></b>');
            return ctx.wizard.next();
        },
        async (ctx: any) => {
            ctx.wizard.state.amount = ctx.message.text
    
            this.product.push({
                nameProduct: ctx.wizard.state.nameOrder,
                value: ctx.wizard.state.amount,
            })

            if (await ctx.wizard.state.amount =='👈 в главное меню') {
                ctx.reply('Главное меню', 
                this.buttons.SET_MAIN_MENU());
                for (let member in this.product) delete this.product[member];
                return ctx.scene.leave()
            }
    
            let html = this.product.map((f: any) => {
                return `===================\n <b>📦Товар:</b> ${f.nameProduct}\n <b>⚖️Кол-во:</b> ${f.value}`
            }).join('\n');

            await ctx.reply('Корзина:')
            await ctx.replyWithHTML(`${html}`,
            this.buttons.SET_VERIFY_ORDER())
            
            return ctx.wizard.next();
        },
        async (ctx: any) => {
            ctx.wizard.state.reply = ctx.message.text;
    
            if (await ctx.wizard.state.reply == '👈 в главное меню') {
                ctx.reply('Главное меню', 
                this.buttons.SET_MAIN_MENU());
                for (let member in this.product) delete this.product[member];
                return ctx.scene.leave()
            }
    
            if (await ctx.wizard.state.reply == '📤 Записать заказ') {
                ctx.wizard.state.orderId = Math.floor(Math.random() * (999 - 100 + 1) ) + 100;
                const user = await this.userController.findUserByChatId(ctx.wizard.state.chatId)
                const order = new Order()

                order.product = this.product
                order.status = 'Новый'
                order.orderId = ctx.wizard.state.orderId
                order.createdAt = new Date()
                order.updatedAt = new Date()
                if (user) {
                    order.user = user
                }

                await this.userController.saveOrder(order)

                this.product.forEach((products: any) => {
                    this.userController.saveProducts(products)
                })

                const messageForChat = await this.userController.findOrderByCreatedAt(user, {$gte: new Date(new Date().getTime() - 1000 * 60 * 0.1)})
                await ctx.telegram.sendMessage('-1001223826227', messageForChat)
    
                for (let member in this.product) delete this.product[member];
    
                await ctx.reply('Заказ оформлен',
                this.buttons.SET_MAIN_MENU())
                return await ctx.scene.leave();
            }
    
            if (await ctx.wizard.state.reply == '📝 Добавить ещё товар') {
                return await ctx.scene.reenter('orderScene');
            }
        }
        )
    }
}