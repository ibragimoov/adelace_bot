import {Entity, ObjectID, ObjectIdColumn, Column, OneToMany, ManyToMany, ManyToOne, PrimaryColumn, JoinColumn, PrimaryGeneratedColumn} from "typeorm";
import { Order } from "./order.entity";

@Entity('products')
export class Product {
    @ObjectIdColumn()
    id: ObjectID

    @PrimaryGeneratedColumn()
    productId: number;

    @Column()
    nameProduct: string;

    @Column()
    value: string;

    @ManyToOne(() => Order, order => order.product)
    order: Order
}