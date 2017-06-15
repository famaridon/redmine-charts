import { NextFunction, Request, Response, Router } from "express";
import {RedmineDataLoggerService} from '../services/RedmineDataLoggerService'
import {RedmineService, Version} from '../services/RedmineService'
import {ChartType} from '../entities/ChartEntity'

export class ApiRoute  {

  private router: Router;
  private datas: RedmineDataLoggerService;
  private redmine: RedmineService;

  constructor(router: Router, redmine: RedmineService, datas: RedmineDataLoggerService) {
    //log
    console.log("[IndexRoute::create] Creating index route.");
    this.router = router;
    this.redmine = redmine;
    this.datas = datas;
    this.router.route('/charts/:version/:type')
    .get((req: Request, res: Response, next: NextFunction) => {
      this.getChart(req, res);
    });
  }

  private async getChart(req: Request, res: Response):Promise<void> {
    let type: ChartType = req.params.type;
    // TODO : hard coded project
    let version = await this.redmine.findCurrentVersions("moovapps-process-team");
    let iteration = await this.datas.getIteration(version);
    let chart = await this.datas.getChart(iteration, type);
    let datas = await this.datas.getDatas(chart);
    let chartjs_data = new Array<any>();
    datas.forEach((item) => {
      chartjs_data.push({x: item.date, y: item.value})
    });
    res.json(chartjs_data);
  }

}
