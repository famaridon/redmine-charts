import cron = require('cron');
import {RedmineService, VersionStatus, Version, Issue} from './RedmineService'
import {EntitiesService} from './EntitiesServices'
import {ConfigurationService} from './ConfigurationService'
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
  protected configurationService: ConfigurationService;
  protected jobs: cron.CronJob[] = new Array<cron.CronJob>();

  private constructor(redmineService: RedmineService,entitiesService: EntitiesService, configurationService: ConfigurationService) {
    this.redmineService = redmineService;
    this.entitiesService = entitiesService;
    this.configurationService = configurationService;
  }

  public static async getInstance() : Promise<RedmineDataLoggerService> {
    if(!RedmineDataLoggerService._instance) {
      let redmineService = await RedmineService.getInstance();
      let entitiesService = await EntitiesService.getInstance();
      let configurationService = await ConfigurationService.getInstance();
      RedmineDataLoggerService._instance = new RedmineDataLoggerService(redmineService, entitiesService, configurationService);
    }
    return RedmineDataLoggerService._instance;
  }

  public start(){
    let burndownCron = this.configurationService.getCron("burndown");
    console.log(`start burndown cron ${burndownCron}`);
    let burndown = new CronJob(burndownCron, () => {
      this.logBurndownInPoint().catch((error) => {console.log(error);});
    }, () => {}, true);
    this.jobs.push(burndown);
  }

  private async logBurndownInPoint(){
    let version = await this.redmineService.findCurrentVersions("moovapps-process-team");
    let iteration = await this.entitiesService.getIteration(version);
    console.log(`add point to iteration "${iteration.name}"`);
    let issues: Issue[] = await this.redmineService.listIssues(version, {tracker_id: 36, status_id:'*', limit:500});
    let duePoint: number = 0;
    let duePointByCategory: Map<number,number> = new Map();
    issues.forEach((issue) =>{
      let cf = issue.getCustomField(28); // 28 is point
      if(cf != null){
        let points = cf.value;
        let pointRemaining = points * (1 - (issue.done_ratio /100));
        duePoint += pointRemaining;
        // add by category
        let categoryDuePoint = duePointByCategory.get(issue.category.id);
        if(!categoryDuePoint) { // init category
          categoryDuePoint = 0;
        }
        duePointByCategory.set(issue.category.id, categoryDuePoint + pointRemaining);
      }
    })

    let chart = await this.entitiesService.getChart(iteration, "burndown");
    this.entitiesService.dataRepository.persist(new DataEntity(chart, duePoint));
    console.log(`due points ${duePoint}`);
    duePointByCategory.forEach(async (value: number, key: number) => {
      let categoryChart = await this.entitiesService.getChart(iteration, `burndown-${key}`);
      this.entitiesService.dataRepository.persist(new DataEntity(categoryChart, value));
      console.log(`${key} have ${value} due points.`);
    });
  }

  private async logDoneRatio(version: Version, iteration: IterationEntity){
    console.log(`add point to iteration "${iteration.name}"`);
    let issues: Issue[] = await this.redmineService.listIssues(version, {tracker_id: 36, status_id:'*', limit:500});
    let done_ratio: number = 0;
    issues.forEach((issue) =>{
      console.log(`issue ${issue.id} donne_ration ${issue.done_ratio}`);
      done_ratio += issue.done_ratio;
    })
    done_ratio = done_ratio / issues.length;
    console.log(`donne ration ${done_ratio}`);
  }
}
