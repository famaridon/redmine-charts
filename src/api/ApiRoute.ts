import { NextFunction, Request, Response, Router } from "express";
import {RedmineDataLoggerService} from '../services/RedmineDataLoggerService'
import {RedmineService, VersionStatus, Version, Issue, CustomField} from '../services/RedmineService'
import {EntitiesService} from '../services/EntitiesServices'
import {ChartType} from '../entities/ChartEntity'

export class ApiRoute  {

  private router: Router;
  private redmineService: RedmineService;
  private entitiesService: EntitiesService;

  constructor(router: Router, redmineService: RedmineService, entitiesService: EntitiesService) {
    //log
    this.redmineService = redmineService;
    this.entitiesService = entitiesService;
    this.router = router;
    this.router.route('/charts/:version/:type')
    .get((req: Request, res: Response, next: NextFunction) => {
      this.getChart(req, res);
    });
    this.router.route('/charts/:version')
    .get((req: Request, res: Response, next: NextFunction) => {
      this.getVersion(req, res);
    });
    this.router.route('/indicator/:type')
    .get((req: Request, res: Response, next: NextFunction) => {
      this.getIndicator(req, res);
    });
  }

  private async getChart(req: Request, res: Response):Promise<void> {
    let type: ChartType = req.params.type;
    let versionString: string = req.params.version;
    let version: Version ;
    switch (versionString){
      case "current":
      {
        version = await this.redmineService.findCurrentVersions("moovapps-process-team");
        break;
      }
      case "next":
      {
        version = await this.redmineService.findNextVersions("moovapps-process-team");
        break;
      }
      default:
      res.status(404);
      return;
    }

    let result: Promise<any>;
    switch(type) {
      case "burndown" : {
        result = this.buildBurndown(version);
        break;
      }
      case "prioritization" : {
        result = this.buildPrioritization(version);
        break;
      }
      default:
      res.status(404);
      return;
    }

    res.header("Access-Control-Allow-Origin", "*");
    res.json(await result);
  }

  private async buildBurndown(version: Version):Promise<any> {
    let iteration = await this.entitiesService.getIteration(version);
    let chart = await this.entitiesService.getChart(iteration, "burndown");
    let datas = await this.entitiesService.getDatas(chart);
    let chartjs_data = new Array<any>();
    datas.forEach((item) => {
      chartjs_data.push({x: item.date, y: item.value})
    });
    return chartjs_data;
  }

  private async buildPrioritization(version: Version):Promise<any> {
    let userSories = await this.redmineService.listIssues(version, {tracker_id: 36, status_id:'open', per_page:500});
    let chartjs_data = new Array<any>();
    userSories.forEach((item) => {
      let bv = item.getCustomField(24);
      let points = item.getCustomField(28);
      if(bv != null && points !=  null) {
        chartjs_data.push({y:bv.value , x: points.value, r: 20});
      }

    });
    return chartjs_data;
  }

  private async getVersion(req: Request, res: Response):Promise<void> {
    let version = await this.redmineService.findCurrentVersions("moovapps-process-team");
    res.header("Access-Control-Allow-Origin", "*");
    res.json(version);
  }

  private async getIndicator(req: Request, res: Response):Promise<void> {
    let type = req.params.type;
    res.header("Access-Control-Allow-Origin", "*");
    if(type === "UserStoryWithBusinessValue"){
      this.getUserStoryWithBusinessValue(req,res);
    } else if(type === "UserStoryWithPoints"){
      this.getUserStoryWithPoints(req,res);
    } else {
      res.statusCode = 404;
    }
  }

  private async getUserStoryWithBusinessValue(req: Request, res: Response):Promise<void> {
    let version = await this.redmineService.findNextVersions("moovapps-process-team");
    let issues: Issue[] = await this.redmineService.listIssues(version, {tracker_id: 36, status_id:'*', per_page:500});
    let withBusinessValue: number = 0;
    issues.forEach((issue: Issue) => {
      let businessValue: CustomField | null = issue.getCustomField(24);
      if(businessValue != null && businessValue.value != "") {
        withBusinessValue++;
      }
    })
    res.header("Access-Control-Allow-Origin", "*");
    res.json({percentage: (withBusinessValue /issues.length) * 100 });
  }

  private async getUserStoryWithPoints(req: Request, res: Response):Promise<void> {
    let version = await this.redmineService.findNextVersions("moovapps-process-team");
    let issues: Issue[] = await this.redmineService.listIssues(version, {tracker_id: 36, status_id:'*', per_page:500});
    let withPoints: number = 0;
    issues.forEach((issue: Issue) => {
      let points: CustomField | null = issue.getCustomField(28);
      if(points != null && points.value != "") {
        withPoints++;
      }
    })
    res.header("Access-Control-Allow-Origin", "*");
    res.json({percentage: (withPoints /issues.length) * 100 });
  }

}
