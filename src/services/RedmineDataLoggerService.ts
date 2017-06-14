import cron = require('cron');
import {Connection, Repository, ObjectLiteral} from "typeorm";
import {RedmineService, VersionStatus, Version, Issue} from './RedmineService'
import {ChartEntity, ChartType} from '../entities/ChartEntity'
import {IterationEntity} from '../entities/IterationEntity'
import {DataEntity} from '../entities/DataEntity'

var CronJob = cron.CronJob;
var CronTime = cron.CronTime;

var timeZone = 'America/Los_Angeles';

export class RedmineDataLoggerService {
  protected redmine: RedmineService;
  protected connection: Connection;

  protected iterationRepository: Repository<IterationEntity>;
  protected chartRepository: Repository<ChartEntity>;
  protected dataRepository: Repository<DataEntity>;

  constructor(redmine: RedmineService, connection: Connection) {
    this.redmine = redmine;
    this.connection = connection;
    this.iterationRepository = connection.getRepository(IterationEntity);
    this.chartRepository = connection.getRepository(ChartEntity);
    this.dataRepository = connection.getRepository(DataEntity);
  }

  public async initIteration(version: Version): Promise<IterationEntity>{
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

  public async initChart(iteration: IterationEntity, type: ChartType): Promise<ChartEntity>{
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

  public async startLogBurndownInPoint(version: Version){
    var iteration = await this.initIteration(version);
    var chart = await this.initChart(iteration, "burndown");
    new CronJob('* * * * * *', () => {
      this.logBurndownInPoint(version,iteration,chart);
    }, () => {}, true, 'America/Los_Angeles');
  }

  private async logBurndownInPoint(version: Version, iteration: IterationEntity, chart: ChartEntity){
    console.log(`add point to iteration "${iteration.name}"`);
    let issues: Issue[] = await this.redmine.listIssues(version, {tracker_id: 36, status_id:'*', per_page:500});
    let duePoint: number = 0;
    issues.forEach((issue) =>{
      let cf = issue.getCustomField(28);
      if(cf != null){
        let points = cf.value;
        duePoint += points * (1 - (issue.done_ratio /100));
      }
    })
    let data = new DataEntity();
    data.chart = chart;
    data.date = new Date();
    data.value = duePoint;
    this.dataRepository.persist(data);
    console.log(`due points ${duePoint}`);
  }

  private async logDoneRatio(version: Version, iteration: IterationEntity){
    console.log(`add point to iteration "${iteration.name}"`);
    let issues: Issue[] = await this.redmine.listIssues(version, {tracker_id: 36, status_id:'*', per_page:500});
    let done_ratio: number = 0;
    issues.forEach((issue) =>{
      console.log(`issue ${issue.id} donne_ration ${issue.done_ratio}`);
      done_ratio += issue.done_ratio;
    })
    done_ratio = done_ratio / issues.length;
    console.log(`donne ration ${done_ratio}`);
  }
}
