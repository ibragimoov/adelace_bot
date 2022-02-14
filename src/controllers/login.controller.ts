import { Markup } from 'telegraf';
import { Action } from '../constants/actions';
import { Buttons } from "../keyboard/buttons";
import { User } from '../entities/user.entity';
import {getMongoRepository} from 'typeorm'

const WizardScene = require("telegraf/scenes/wizard");
export class LoginController {
    private buttons = new Buttons()
    private userRepository = getMongoRepository(User);

    login() {
        return new WizardScene('loginScene',
        async (ctx: any) => {
            ctx.replyWithHTML('Введите номер телефона. . .\nНапример <b><i>+79781234567</i></b>',
            this.buttons.BACK_BUTTON())
            return await ctx.wizard.next()
        },
        async (ctx: any) => {
            ctx.wizard.state.phone = ctx.message.text;
            if (await ctx.wizard.state.phone =='👈 Назад') {
                ctx.reply(`Здравствуйте, ${ctx.chat.first_name}`, 
                this.buttons.SET_AUTH())
                return ctx.scene.leave()
            }
            // await phoneSchema.isValid(ctx.wizard.state.phone)
            if (1) {
                await ctx.reply('Анализирую базу данных. . .');
                let phone = ctx.wizard.state.phone
                phone = Number(phone.slice(1, 12))
                await (await this.userRepository.count({phone: phone})
                .then((count: any) => {
                    if (count > 0) {
                        ctx.reply('Доступ к приложению открыт', 
                        this.buttons.SET_MAIN_MENU()
                        );
                        return ctx.scene.leave();
                    }
                    else {
                        this.userRepository.insertOne(
                            {
                            chatId: ctx.from.id, 
                            name: ctx.from.first_name, 
                            phone: phone
                            }
                            ).then(() => {
                            console.log("Data inserted")
                            ctx.reply('Номер телефона зарегистрирован\nОткрываю доступ к приложению. . .',
                            this.buttons.SET_MAIN_MENU())
                            ctx.scene.leave();;
                            }).catch(function(error){
                            console.log(error);
                            });
                    }
                }))
            } else {
                ctx.replyWithHTML('<b>Error</b>: номер телефона записан <i>неправильно</i>')
            }
        }
        )
    }
}
