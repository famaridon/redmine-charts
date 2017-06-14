import "reflect-metadata";
import {createConnection } from "typeorm";
import {RedmineDataLoggerService} from './services/RedmineDataLoggerService'
import {RedmineService, Version} from './services/RedmineService'

var configuration = {
  protocol : 'https:',
  host: 'projects.visiativ.com',
  headers: {
    'X-Redmine-API-Key': '817e6b7df101a989b12aa1de1a44726c635bcb88'
  }
};

var redmine = new RedmineService(configuration);
var dataLogger: RedmineDataLoggerService ;

createConnection().then(connection => {
  dataLogger = new RedmineDataLoggerService(redmine, connection);
  redmine.findCurrentVersions("moovapps-process-team").then((version: Version) => {
    dataLogger.startLogBurndownInPoint(version);
  });
}).catch(error => {
  console.log(error)
});
