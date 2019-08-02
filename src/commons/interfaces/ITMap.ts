export interface IStringTMap<T> { [key: string]: T; }
export interface INumberTMap<T> { [key: number]: T; }

export interface INumberAnyMap extends INumberTMap<any> { }

export interface IStringStringMap extends IStringTMap<string> { }
export interface INumberStringMap extends INumberTMap<string> { }

export interface IStringNumberMap extends IStringTMap<number> { }
export interface INumberNumberMap extends INumberTMap<number> { }

export interface IStringBooleanMap extends IStringTMap<boolean> { }
export interface INumberBooleanMap extends INumberTMap<boolean> { }

export interface Newable<T> {
  new(...args: any[]): T;
}
