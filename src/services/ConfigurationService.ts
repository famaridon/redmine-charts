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

  public static getInstance() : ConfigurationService {
    return ConfigurationService._instance;
  }

  public getRedmineHttp(): any{
    return this.configuration.redmine.http;
  }

}
