import {CorsOptions} from "cors";
import {ChartType} from '../entities/ChartEntity'

export class ConfigurationService {

  private static _instance:ConfigurationService = new ConfigurationService();
  protected configuration: any;

  private constructor() {
    if(ConfigurationService._instance) {
      throw new Error("The ConfigurationService is a singleton class and cannot be created!");
    }
    ConfigurationService._instance = this;
    this.configuration = require('../configuration.json');
  }

  public static async getInstance() : Promise<ConfigurationService> {
    return ConfigurationService._instance;
  }

  public getRedmineHttp(): any{
    return this.configuration.redmine.http;
  }

  public getAPIOptions(): any{
    return this.configuration.api;
  }


  public getCron(type: ChartType): string{
    return this.configuration.cron[type];
  }

}
