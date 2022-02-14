import {Entity, ObjectID, ObjectIdColumn, Column, PrimaryColumn} from "typeorm";

@Entity('users')
export class User {

    @ObjectIdColumn()
    id: ObjectID

    @Column()
    chatId: number;

    @Column()
    name: string;

    @Column()
    phone: number;
}