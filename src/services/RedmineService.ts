import * as https from 'https'
import {VersionStatus, Version, Issue} from './beans/Redmine'
export * from './beans/Redmine'

export class RedmineService {

  protected configuration: any;

  constructor(configuration: any) {
    this.configuration = configuration;
  }

  listIssues(version: Version, filters?: any): Promise<Array<Issue>> {
    let requestConfiguration = Object.assign({}, this.configuration);
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

  findProject(project: number | string): Promise<any> {
    let requestConfiguration = Object.assign({}, this.configuration);
    requestConfiguration.path = `/projects/${project}.json?include=trackers,versions`;
    requestConfiguration.method= 'GET';

    return this.request(requestConfiguration);
  }

  findVersions(project: number | string): Promise<Array<Version>> {
    let requestConfiguration = Object.assign({}, this.configuration);
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

  findCurrentVersions(project: number | string): Promise<Version> {
    return new Promise<Version>((resolve, reject) => {
      this.findVersions("moovapps-process-team")
      .then((versions: Array<Version>) => {
        // filter open versions
        versions = versions.filter(function(version: Version){
          return version.status === "open";
        });
        // sort by due date
        versions.sort((a: Version, b: Version) =>  {
          return a.due_date.getTime() - b.due_date.getTime();
        });
        resolve(versions[0]);
      })
      .catch((reason) => {
        reject(reason);
      });
    });
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
        reject(e);
      });

      // write data to request body
      //req.write(postData);
      req.end();
    });
    return promise;
  }
}
