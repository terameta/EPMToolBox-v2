import * as _ from 'lodash';
import { SortByName, SortByProperty } from '../utilities/utilityFunctions';
import { BehaviorSubject } from 'rxjs';
import { share, publish } from 'rxjs/operators';

export interface ATStoreSubject<T> {
	[key: number]: T
}

export interface ATBaseType {
	id: number
}

export interface ATNamedBaseType extends ATBaseType {
	name: string
}

export class ATStoreClass<T extends ATBaseType>  {
	private _sortProperty: string;

	public ids = new BehaviorSubject<number[]>( [] );
	public items = new BehaviorSubject<T[]>( [] );
	public subject = new BehaviorSubject<ATStoreSubject<T>>( {} );

	constructor( sourceItems: T[] = [], sorter = 'name' ) {
		this.sorter = sorter;
		this.getAll( sourceItems );
	}

	set sorter( sortProperty: string ) {
		this._sortProperty = sortProperty;
		this.sortItems();
	}

	private sortItems = () => {
		const items = this.subject.getValue();
		this.ids.next( this.ids.getValue().map( id => items[id] ).sort( SortByProperty( this._sortProperty ) ).map( i => i.id ) );
		this.items.next( this.ids.getValue().map( id => items[id] ) );
		// console.log( this.items.observers.length );
	}

	public getAll = ( items: T[] ) => {
		this.subject.next( _.keyBy( items, 'id' ) );
		this.ids.next( items.map( i => i.id ) );
		this.sortItems();
	}
}

// Before decreasing class size with making everything observable

// export class ATStoreClass<T extends ATBaseType>  {
// 	private _subject: ATStoreSubject<T>;
// 	private _ids: number[];
// 	private _sortProperty: string;

// 	public ids = new BehaviorSubject<number[]>( [] );
// 	public items = new BehaviorSubject<T[]>( [] );
// 	public subject = new BehaviorSubject<ATStoreSubject<T>>( {} );

// 	constructor( sourceItems: T[] = [], sorter = 'name' ) {
// 		this.sorter = sorter;
// 		this._items = sourceItems;
// 	}

// 	set sorter( sortProperty: string ) {
// 		this._sortProperty = sortProperty;
// 		this.sortItems();
// 	}

// 	private sortItems = () => {
// 		this._ids = this._items.sort( SortByProperty( this._sortProperty ) ).map( i => i.id );
// 	}

// 	private get _items(): T[] {
// 		return this._ids.map( id => this._subject[id] );
// 	}

// 	private set _items( items: T[] ) {
// 		this._subject = _.keyBy( items, 'id' );
// 		this._ids = items.map( i => i.id );
// 		this.sortItems();

// 		this.ids.next( this._ids );
// 		this.items.next( this._items );
// 		this.subject.next( this._subject );
// 	}
// }
