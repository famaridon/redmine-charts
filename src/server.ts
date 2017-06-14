import "reflect-metadata";

import * as express from "express";
import * as path from "path";
import {createConnection } from "typeorm";
import {RedmineDataLoggerService} from './services/RedmineDataLoggerService'
import {RedmineService, Version} from './services/RedmineService'

class Server {

  public app: express.Application;
  public redmine: RedmineService;
  public dataLogger: RedmineDataLoggerService;

  public static async bootstrap(config: any): Promise<Server> {
    let redmine = new RedmineService(config);
    let connection = await createConnection();
    let dataLogger = new RedmineDataLoggerService(redmine, connection);
    return new Server(redmine, dataLogger);
  }

  constructor(redmine: RedmineService, dataLogger:RedmineDataLoggerService ) {
    //create expressjs application
    this.app = express();
    this.redmine = redmine;
    this.dataLogger= dataLogger;
  }

  public async start(): Promise<void>{
    let version = this.redmine.findCurrentVersions("moovapps-process-team")
    this.dataLogger.startLogBurndownInPoint(await version);
    this.app.get('/', (req, res) => {
      res.send('Hello World!');
    });
    this.app.listen(3000, () => {
      console.log('Example app listening on port 3000!');
    });
  }
}

var configuration = {
  protocol : 'https:',
  host: 'projects.visiativ.com',
  headers: {
    'X-Redmine-API-Key': '817e6b7df101a989b12aa1de1a44726c635bcb88'
  }
};

Server.bootstrap(configuration).then((server) => {
  server.start();
})
