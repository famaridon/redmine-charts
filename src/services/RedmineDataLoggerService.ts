import cron = require('cron');
import {RedmineService, VersionStatus, Version, Issue} from './RedmineService'
import {EntitiesService} from './EntitiesServices'
import {ChartEntity, ChartType} from '../entities/ChartEntity'
import {IterationEntity} from '../entities/IterationEntity'
import {DataEntity} from '../entities/DataEntity'

var CronJob = cron.CronJob;
var CronTime = cron.CronTime;

var timeZone = 'America/Los_Angeles';

export class RedmineDataLoggerService {

  private static _instance:RedmineDataLoggerService;

  protected redmineService: RedmineService;
  protected entitiesService: EntitiesService;

  private constructor(redmineService: RedmineService,entitiesService: EntitiesService) {
    this.redmineService = redmineService;
    this.entitiesService = entitiesService;
  }

  public static async getInstance() : Promise<RedmineDataLoggerService> {
    if(!RedmineDataLoggerService._instance) {
      let redmineService = await RedmineService.getInstance();
      let entitiesService = await EntitiesService.getInstance();
      RedmineDataLoggerService._instance = new RedmineDataLoggerService(redmineService, entitiesService);
    }
    return RedmineDataLoggerService._instance;
  }

  public start(){
    new CronJob('0 * * * * *', () => {
      this.logBurndownInPoint();
    }, () => {}, true);
  }

  private async logBurndownInPoint(){
    let version = await this.redmineService.findCurrentVersions("moovapps-process-team");
    let iteration = await this.entitiesService.getIteration(version);
    let chart = await this.entitiesService.getChart(iteration, "burndown");
    console.log(`add point to iteration "${iteration.name}"`);
    let issues: Issue[] = await this.redmineService.listIssues(version, {tracker_id: 36, status_id:'*', per_page:500});
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
    this.entitiesService.dataRepository.persist(data);
    console.log(`due points ${duePoint}`);
  }

  private async logDoneRatio(version: Version, iteration: IterationEntity){
    console.log(`add point to iteration "${iteration.name}"`);
    let issues: Issue[] = await this.redmineService.listIssues(version, {tracker_id: 36, status_id:'*', per_page:500});
    let done_ratio: number = 0;
    issues.forEach((issue) =>{
      console.log(`issue ${issue.id} donne_ration ${issue.done_ratio}`);
      done_ratio += issue.done_ratio;
    })
    done_ratio = done_ratio / issues.length;
    console.log(`donne ration ${done_ratio}`);
  }
}
