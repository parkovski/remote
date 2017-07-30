export interface IGroup {
  title: string;
  commands: string[];
}

export interface ILayoutMap {
  styles?: {default?: any, [_:string]:any};
  groups: IGroup[];
  labels?: {[_:string]:string};
}

/// If the layout is specified, only the buttons
/// listed will be displayed.
export type ICommandResponse = string[] | ILayoutMap;
