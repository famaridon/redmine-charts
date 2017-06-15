import {createConnection } from "typeorm";
import {Connection, Repository, ObjectLiteral} from "typeorm";
import {RedmineService, VersionStatus, Version, Issue} from './RedmineService'
import {ChartEntity, ChartType} from '../entities/ChartEntity'
import {IterationEntity} from '../entities/IterationEntity'
import {DataEntity} from '../entities/DataEntity'

export class EnititiesService {

  private static _instance:EnititiesService;

  protected connection: Connection;
  protected iterationRepository: Repository<IterationEntity>;
  protected chartRepository: Repository<ChartEntity>;
  protected dataRepository: Repository<DataEntity>;

  private constructor(connection: Connection) {
    this.connection = connection;
    this.iterationRepository = connection.getRepository(IterationEntity);
    this.chartRepository = connection.getRepository(ChartEntity);
    this.dataRepository = connection.getRepository(DataEntity);
  }

  public static async getInstance() : Promise<EnititiesService> {
    if(!EnititiesService._instance) {
      let connection = await createConnection();
      EnititiesService._instance = new EnititiesService(connection);
    }
    return EnititiesService._instance;
  }


  public async getIteration(version: Version): Promise<IterationEntity>{
    console.log("Check if version is find as iteration");
    var iteration = await this.iterationRepository.findOne(<ObjectLiteral>{externalId: version.id});
    if(!iteration) {
      iteration = new IterationEntity();
      iteration.externalId = String(version.id);
      iteration.name = version.name;
      await this.iterationRepository.persist(iteration);
      console.log(`Iteration ${version.name} created`);
    }
    return iteration
  }

  public async getChart(iteration: IterationEntity, type: ChartType): Promise<ChartEntity>{
    console.log("Check if chart is find on this iteration");
    var chart = await this.chartRepository.findOne(<ObjectLiteral>{iteration: iteration.id, type: type});
    if(!chart ) {
      chart = new ChartEntity();
      chart.iteration = iteration;
      chart.type = type;
      await this.chartRepository.persist(chart);
      console.log(`Chart ${chart.type} created on iteration ${iteration.name}`);
    }
    return chart;
  }

  public async getDatas(chart: ChartEntity): Promise<DataEntity[]>{
    return this.dataRepository.find(<ObjectLiteral>{chart: chart.id});
  }

}
