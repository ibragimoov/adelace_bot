import {getMongoRepository} from "typeorm";
import {User} from "../entities/user.entity";
import * as yup from "yup";

interface IUser {
    Name: string
}

export class UserController {
    phoneSchema = yup.string().matches(/^\+[0-9]{3}(\d+)\d{3}\d{2}\d{2}/g).required().max(12);
    private userRepository = getMongoRepository(User)

    async findUser(phone: number) {
        return await this.userRepository.findOne({where: {phone: phone}})
    }

    async findUserByChatId(chatId: number) {
        return await this.userRepository.findOne({where: {chatId: chatId}})
    }
    
    async saveUser(body: object) {
        await this.userRepository.save(body)
    }
}