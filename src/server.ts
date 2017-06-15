import "reflect-metadata";

import * as winston from "winston";
import * as express from "express";
import * as bodyParser from "body-parser";
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
  public api: ApiRoute;

  public static async bootstrap(): Promise<Server> {
    winston.info('Now my debug messages are written to the console!');
    let redmineService = await RedmineService.getInstance();
    let redmineDataLoggerService = await RedmineDataLoggerService.getInstance();
    let entitiesService = await EntitiesService.getInstance();
    return new Server(redmineService,entitiesService, redmineDataLoggerService);
  }

  constructor(redmine: RedmineService,entitiesService: EntitiesService, redmineDataLoggerService:RedmineDataLoggerService ) {
    //create expressjs application
    this.app = express();
    this.router = express.Router();
    this.redmine = redmine;
    this.dataLogger = redmineDataLoggerService;
    this.api= new ApiRoute(this.router, this.redmine, entitiesService);
    this.app.use('/api', this.router);
  }

  public async start(): Promise<void>{
    this.dataLogger.start();

    this.app.get('/', (req, res) => {
      res.send('Hello World!');
    });


    this.app.listen(3000, () => {
      console.log('Example app listening on port 3000!');
    });
  }
}

Server.bootstrap().then((server) => {
  server.start();
})
