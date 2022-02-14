import {Entity, ObjectID, ObjectIdColumn, Column, OneToMany, ManyToMany, ManyToOne, PrimaryColumn} from "typeorm";
import { Order } from "./order.entity";

@Entity('products')
export class Product {

    @ObjectIdColumn()
    id: ObjectID

    @Column()
    chatId: string;

    @Column()
    nameProduct: string;

    @Column()
    value: string;

    @ManyToOne(() => Order, order => order.products)
    order: Order

}