import {Entity, Column,ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {ChartEntity} from "./ChartEntity";

@Entity()
export class DataEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    value: number;

    @Column()
    date: Date;

    @ManyToOne(type => ChartEntity, chart => chart.datas)
    chart: ChartEntity;

}
