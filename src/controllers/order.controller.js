import { Markup, Scenes } from 'telegraf';
import { buttons } from "../keyboard/buttons.js";
import typeorm from 'typeorm'
import Order from '../models/order.model.js';
import Product from '../models/products.model.js';

const product = [];

const orderScene = new Scenes.WizardScene('orderScene',
    async (ctx) => {
        await ctx.reply('Введите название товара. . .',
        Markup.keyboard(buttons.BUTTON_MAIN_MENU)
        .resize());
        return await ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.chatId = ctx.chat.id;
        ctx.wizard.state.nameOrder = ctx.message.text;

        if (await ctx.wizard.state.nameOrder =='👈 в главное меню') {
            ctx.reply('Главное меню', 
            Markup.keyboard(buttons.MAIN_MENU)
            .resize());
            return ctx.scene.leave()
        }

        await ctx.replyWithHTML('Введите количество товара. . .\nНапример: <b><i>5</i></b>');
        return await ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.amount = ctx.message.text
        if (await ctx.wizard.state.amount =='👈 в главное меню') {
            ctx.reply('Главное меню', 
            Markup.keyboard(buttons.MAIN_MENU)
            .resize());
            for (let member in product) delete product[member];
            return ctx.scene.leave()
        }

        ctx.reply('Подтверждение заказа. . .',
        Markup.keyboard(buttons.VERIFY_ORDER)
        .resize())
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.reply = ctx.message.text;
        const orderRep = typeorm.getMongoRepository(Order, "adelace")
        const productRep = typeorm.getMongoRepository(Product, "adelace")
        if (await ctx.wizard.state.reply =='👈 в главное меню') {
            ctx.reply('Главное меню', 
            Markup.keyboard(buttons.MAIN_MENU)
            .resize());
            for (let member in product) delete product[member];
            return ctx.scene.leave()
        }

        if (await ctx.wizard.state.reply == '📤 Записать заказ') {
            ctx.wizard.state.orderId = Math.floor(Math.random() * (999 - 100 + 1) ) + 100;
            product.push({
                chatId: ctx.wizard.state.chatId, 
                nameProduct: ctx.wizard.state.nameOrder,
                value: ctx.wizard.state.amount
            })
            orderRep.insertOne(
                {
                    chatId: ctx.wizard.state.chatId,
                    status: 'Новый',
                    orderId: ctx.wizard.state.orderId,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ).catch(function(error){
            console.log(error);
            });

            product.forEach(products => {
                productRep.insertOne({
                    chatId: products.chatId,
                    orderId: ctx.wizard.state.orderId,
                    nameProduct: products.nameProduct,
                    value: products.value
                })
            })

            for (let member in product) delete product[member];

            await ctx.reply('Заказ записан',
            Markup.keyboard(buttons.MAIN_MENU)
            .resize())
            return await ctx.scene.leave();
        }

        if (await ctx.wizard.state.reply == '📝 Добавить ещё товар') {
            product.push({
                chatId: ctx.wizard.state.chatId, 
                nameProduct: ctx.wizard.state.nameOrder,
                value: ctx.wizard.state.amount
            })

            let html = product.map((f, i) => {
                return `===================\n <b>📦Товар:</b> ${f.nameProduct}\n <b>⚖️Кол-во:</b> ${f.value}`
            }).join('\n');
            
            await ctx.replyWithHTML(html)
            return await ctx.scene.reenter('orderScene');
        }
    }
)

export default orderScene;