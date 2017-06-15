import { NextFunction, Request, Response, Router } from "express";
import {RedmineDataLoggerService} from '../services/RedmineDataLoggerService'
import {RedmineService, Version} from '../services/RedmineService'
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
    console.log("[IndexRoute::create] Creating index route.");
    this.router = router;
    this.router.route('/charts/:version/:type')
    .get((req: Request, res: Response, next: NextFunction) => {
      this.getChart(req, res);
    });
  }

  private async getChart(req: Request, res: Response):Promise<void> {
    let type: ChartType = req.params.type;
    // TODO : hard coded project
    let version = await this.redmineService.findCurrentVersions("moovapps-process-team");
    let iteration = await this.entitiesService.getIteration(version);
    let chart = await this.entitiesService.getChart(iteration, type);
    let datas = await this.entitiesService.getDatas(chart);
    let chartjs_data = new Array<any>();
    datas.forEach((item) => {
      chartjs_data.push({x: item.date, y: item.value})
    });
    res.header("Access-Control-Allow-Origin", "*");
    res.json(chartjs_data);
  }

}
