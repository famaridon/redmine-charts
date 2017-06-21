export type VersionStatus = "open" | "close" | "locked";

export class Version {
  id: number;
  name: string;
  description: string;
  status: VersionStatus;
  due_date: Date;
  created_on: Date;
  updated_on: Date;
}

export class Issue {
  id: number;
  subject: string;
  description: string;
  project: Project;
  tracker: Tracker;
  status: Status;
  priority: Priority;
  author: User;
  category: Category;
  fixed_version: Version;
  start_date: Date;
  created_on: Date;
  updated_on: Date;
  done_ratio: number;
  custom_fields: CustomField[];

  constructor() { }

  getCustomField(id: number): CustomField | null{
    let cf: CustomField | null = null;
    this.custom_fields.forEach((item) => {
      if (item.id === id){
        cf = item;
        return ;
      }
    });
    if(cf != null ){
      if((<CustomField>cf).value == "" || (<CustomField>cf).value == null) {
        cf = null;
      }
    }
    return cf;
  }
}

export class CustomField {
  id: number;
  name: string;
  value: any;
}

export class Project {
  id: number;
  name: string;
}

export class Tracker {
  id: number;
  name: string;
}

export class Status {
  id: number;
  name: string;
}

export class Priority {
  id: number;
  name: string;
}

export class User {
  id: number;
  name: string;
}

export class Category {
  id: number;
  name: string;
}
