import { Buttons } from "../keyboard/buttons";
import { User } from '../entities/user.entity';
import {getMongoRepository} from 'typeorm';
import { UserController } from './user.controller';

const WizardScene = require("telegraf/scenes/wizard");
export class LoginController {
    private buttons = new Buttons()
    private userRepository = getMongoRepository(User);
    private userController = new UserController()

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
            if (await this.userController.phoneSchema.isValid(ctx.wizard.state.phone)) {
                await ctx.reply('Анализирую базу данных. . .');
                let phone = ctx.wizard.state.phone
                phone = Number(phone.slice(1, 12))
                const user = await this.userController.findUser(phone)

                if (user) {
                    await ctx.reply('Пользователь уже зарегистрирован.\nДоступ к приложению открыт',
                      this.buttons.SET_MAIN_MENU()
                    );

                    return ctx.scene.leave();

                } else {
                    const newUser = {
                        chatId: ctx.chat.id,
                        name: ctx.chat.first_name,
                        phone: phone
                    }
                    
                    await this.userController.saveUser(newUser)
                    await ctx.reply('Номер телефона зарегистрирован\nОткрываю доступ к приложению. . .',
                    this.buttons.SET_MAIN_MENU())
                    
                    return ctx.scene.leave()
                }
            } else {
                ctx.replyWithHTML('<b>Error</b>: номер телефона записан <i>неправильно</i>')
            }
        }
        )
    }
}
