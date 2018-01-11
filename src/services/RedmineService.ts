import * as https from 'https'
import {VersionStatus, Version, Issue} from './beans/Redmine'
import {ConfigurationService} from './ConfigurationService'
export * from './beans/Redmine'

export class RedmineService {

  private static _instance:RedmineService;

  protected configurationService: ConfigurationService;
  protected httpConfiguration: any;

  constructor(configurationService: ConfigurationService) {
    this.configurationService= configurationService;
    this.httpConfiguration= this.configurationService.getRedmineHttp();
  }

  public static async getInstance() : Promise<RedmineService> {
    if(!RedmineService._instance) {
      let configurationService = await ConfigurationService.getInstance();
      RedmineService._instance = new RedmineService(configurationService);
    }
    return RedmineService._instance;
  }

  listIssues(version: Version, filters?: any): Promise<Array<Issue>> {
    let requestConfiguration = Object.assign({}, this.httpConfiguration);
    let filtersQuery: string = "";
    if( filters ) {
      for(var filter in filters) {
        filtersQuery += `${filter}=${filters[filter]}&`;
      }
    }

    requestConfiguration.path = `/issues.json?fixed_version_id=${version.id}&${filtersQuery}`;
    console.log(`filtersQuery ${requestConfiguration.path}`);
    requestConfiguration.method= 'GET';
    return new Promise<Array<Issue>>((resolve, reject) => {
      this.request(requestConfiguration).then((body: any) => {
        let casted: Array<Issue> = new Array<Issue>();
        body.issues.forEach((item: any) => {
          casted.push(Object.assign(new Issue(), item));
        });
        resolve(casted);
      })
      .catch((reason) => {
        reject(reason);
      });;
    });
  }

  async findProject(project: number | string): Promise<any> {
    let requestConfiguration = Object.assign({}, this.httpConfiguration);
    requestConfiguration.path = `/projects/${project}.json?include=trackers,versions`;
    requestConfiguration.method= 'GET';

    return this.request(requestConfiguration);
  }

  async findVersions(project: number | string): Promise<Array<Version>> {
    let requestConfiguration = Object.assign({}, this.httpConfiguration);
    requestConfiguration.path = `/projects/${project}/versions.json`;
    requestConfiguration.method= 'GET';
    return new Promise<Array<Version>>((resolve, reject) => {
      this.request(requestConfiguration).then((body: any) => {
        resolve(body.versions);
      })
      .catch((reason) => {
        reject(reason);
      });;
    });
  }

  async findCurrentVersions(project: number | string): Promise<Version> {
    let versions: Array<Version> = await this.findVersions(project);
    versions = versions.filter(this.filterOpenVersion);
    // sort by due date
    versions.sort(this.sortVersions);
    return versions[0];

  }

  async findNextVersions(project: number | string): Promise<Version> {
    let versions: Array<Version> = await this.findVersions(project);
    versions = versions.filter(this.filterOpenVersion);
    // sort by due date
    versions.sort(this.sortVersions);
    return versions[1];

  }

  private filterOpenVersion(version: Version): boolean{
    return version.status === "open";
  }
  private sortVersions(a: Version, b: Version): number{
    if(!a.due_date) {
      return -1;
    } else if (!b.due_date){
      return 1;
    }
    return a.due_date.getTime() - b.due_date.getTime();
  }

  private request(configuration: any): Promise<any> {
    let promise = new Promise<any>((resolve, reject) => {
      let req = https.request(configuration, (res: any) => {
        res.setEncoding('utf8');
        let bodyString = "";
        res.on('data', (chunk:any) => {
          bodyString += chunk;
        });
        res.on('end', () => {
          resolve(JSON.parse(bodyString, (key, value) => {
            if (typeof value === 'string') {
              // parse redmine dates
              let date = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.exec(value);
              if (date) {
                return new Date(value);
              }
              // parse redmine date time
              let datetime = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/.exec(value);
              if (datetime) {
                return new Date(value);
              }
            }
            return value;
          }));
        });
      });

      req.on('error', (e: any) => {
        console.log("Request to redmine server fail");
        console.log(e);
        reject(e);
      });

      // write data to request body
      //req.write(postData);
      req.end();
    });
    return promise;
  }
}
