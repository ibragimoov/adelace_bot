import {Entity, ObjectID, ObjectIdColumn, Column, PrimaryColumn, OneToMany, JoinColumn} from "typeorm";
import { Order } from "./order.entity";

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

    @OneToMany(() => Order, order => order.user)

    @JoinColumn()
    order: Order[]
}