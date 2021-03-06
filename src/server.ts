import "reflect-metadata";

import * as winston from "winston";
import * as express from "express";
import * as path from "path";

import {RedmineDataLoggerService} from './services/RedmineDataLoggerService'
import {RedmineService, Version} from './services/RedmineService'
import {EntitiesService} from './services/EntitiesServices'
import {ConfigurationService} from './services/ConfigurationService'
import {ApiRoute} from './api/ApiRoute'


class Server {

  public app: express.Application;
  public router: express.Router;
  public redmine: RedmineService;
  public dataLogger: RedmineDataLoggerService;
  public configurationService: ConfigurationService;
  public api: ApiRoute;

  public static async bootstrap(): Promise<Server> {
    winston.info('bootstrap server and init all services.');
    let redmineService = await RedmineService.getInstance();
    let redmineDataLoggerService = await RedmineDataLoggerService.getInstance();
    let entitiesService = await EntitiesService.getInstance();
    let configurationService = await ConfigurationService.getInstance();
    return new Server(redmineService,entitiesService, redmineDataLoggerService, configurationService);
  }

  constructor(redmine: RedmineService,entitiesService: EntitiesService, redmineDataLoggerService:RedmineDataLoggerService, configurationService: ConfigurationService ) {
    //create expressjs application
    this.app = express();
    this.router = express.Router();
    this.redmine = redmine;
    this.configurationService = configurationService;
    this.dataLogger = redmineDataLoggerService;
    this.api= new ApiRoute(this.router, this.redmine, entitiesService);
    this.app.use('/api', this.router);
  }

  public async start(): Promise<void>{
    winston.info('starting server.');
    this.dataLogger.start();

    let apiOption = this.configurationService.getAPIOptions();
    this.app.listen(apiOption.port, () => {
      winston.info(`api is ready on http://localhost:${apiOption.port}/api/`);
    });
    winston.info('server started');
  }
}

Server.bootstrap().then((server) => {
  server.start();
})
