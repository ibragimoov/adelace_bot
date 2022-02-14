import {Entity, ObjectID, ObjectIdColumn, Column, OneToMany, PrimaryColumn} from "typeorm";
import { Product } from "./product.entity";

@Entity('orders')
export class Order {

    @ObjectIdColumn()
    id: ObjectID

    @Column()
    chatId: string;

    @Column()
    status: string;

    @Column('timestamp')
    createdAt: Date;

    @Column('timestamp')
    updatedAt: Date;

    @OneToMany(() => Product, products => products.order)
    products: Product[]
}