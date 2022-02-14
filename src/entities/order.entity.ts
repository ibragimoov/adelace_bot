import {Entity, ObjectID, ObjectIdColumn, Column, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, ManyToOne, JoinColumn} from "typeorm";
import { Product } from "./product.entity";
import { User } from "./user.entity";

@Entity('orders')
export class Order {
    @ObjectIdColumn()
    id: ObjectID

    @PrimaryColumn()
    orderId: number;

    @Column()
    status: string;

    @Column('timestamp')
    createdAt: Date;

    @Column('timestamp')
    updatedAt: Date;

    @OneToMany(() => Product, product => product.order)
    @Column()
    product: Product[]

    @ManyToOne(() => User, user => user.order)
    user: User
}