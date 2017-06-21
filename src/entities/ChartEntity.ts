import {Entity, Column,OneToMany,ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {DataEntity} from "./DataEntity";
import {IterationEntity} from "./IterationEntity";

@Entity()
export class ChartEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    type: ChartType;

    @ManyToOne(type => IterationEntity, iteration => iteration.charts)
    iteration: IterationEntity;

    @OneToMany(type => DataEntity, data => data.chart)
    datas: DataEntity[];
}

export type ChartType = "burndown" | "prioritization";
