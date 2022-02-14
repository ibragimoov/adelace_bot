import {getMongoRepository} from "typeorm";
import {User} from "../entities/user.entity";
import * as yup from "yup";
import { Order } from "../entities/order.entity";
import { Product } from "../entities/product.entity";
import moment from "moment";

interface IUser {
    Name: string
}

export class UserController {
    phoneSchema = yup.string().matches(/^\+[0-9]{3}(\d+)\d{3}\d{2}\d{2}/g).required().max(12);
    private userRepository = getMongoRepository(User)
    private orderRepository = getMongoRepository(Order)
    private productRepository = getMongoRepository(Product)

    async findUser(phone: number) {
        return await this.userRepository.findOne({where: {phone: phone}})
    }

    async findUserByChatId(chatId: number) {
        return await this.userRepository.findOne({where: {chatId: chatId}})
    }
    
    async saveUser(body: object) {
        await this.userRepository.save(body)
    }

    async saveOrder(body: object) {
        await this.orderRepository.save(body)
    }

    async saveProducts(body: object) {
        await this.productRepository.save(body)
    }

    async findOrderByCreatedAt(user: any, query: any) {
        return this.orderRepository.find({user: user, createdAt: query})
            .then(async orders => {
            let count = 0,
            order_msg = ''

            order_msg = orders.map ((f, i) => {
                count++;
                return `=========================\n Заказ #${i + 1}\n ✅Статус: ${f.status}\n 📅Обновлен: ${moment(f.updatedAt).format('DD.MM.YYYY HH:mm')}\n 🔎Подробнее: /c${f.orderId}`;
            }).join('\n');

            return order_msg += `\n=========================\n\nЗаказчик:   ${user.name}\nID пользователя: -${user.chatId}\n`
        });
    }

    async findOrderByUser(user: any) {
        return this.orderRepository.find({user: user})
            .then(async orders => {
            let count = 0, 
                order_msg = ''

            order_msg = orders.map ((f, i) => {
                count++;
                return `=============================\n <b>Заказ #${i + 1}</b>\n <b>✅Статус:</b> ${f.status}\n <b>📅Обновлено:</b> ${moment(f.updatedAt).format('DD.MM.YYYY, HH:mm')}\n <b>🔎Подробнее:</b> /c${f.orderId}\n\n <b>❎Удалить: /d${f.orderId}</b>`;
            }).join('\n');

            return order_msg += `\n=============================\n\n<b><i>📮Всего заказов:</i></b> ${count}`;
        });
    }

    async findProductByOrderId(user: any, orderId: number) {
        let order_msg: string = '',
            count: number = 0
        const loadedPhoto = await this.orderRepository
        .findOne({orderId: orderId});
        order_msg += loadedPhoto?.product.map((f: any, i: any) => {
            count++;
            return `=========================\n 📦Товар: ${f.nameProduct}\n ⚖️Количество: ${f.value}`;
        }).join('\n')

        return order_msg += `\n=========================\n\nID клиента: -${user.chatId}\nID заказа: +${orderId}`
    }

    async sendProductByQuery(orderId: number) {
        let order_msg: string = '',
            count: number = 0
        const loadedPhoto = await this.orderRepository
        .findOne({orderId: orderId});
        order_msg += loadedPhoto?.product.map((f: any, i: any) => {
            count++;
            return `=========================\n 📦Товар: ${f.nameProduct}\n ⚖️Количество: ${f.value}`;
        }).join('\n')

        return order_msg += `\n===================\n\n<b><i>🧺Всего товаров:</i></b> ${count}`
    }
}