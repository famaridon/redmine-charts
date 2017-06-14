import {Entity, Column,OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {ChartEntity} from "./ChartEntity";

@Entity()
export class IterationEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    externalId: string;

    @OneToMany(type => ChartEntity, chart => chart.iteration, {cascadeInsert: true, cascadeUpdate: true })
    charts: ChartEntity[];
}
