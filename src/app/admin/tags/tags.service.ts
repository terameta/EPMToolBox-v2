import { Injectable } from '@angular/core';
import { AdminSharedService } from '../admin-shared/admin-shared.service';
import { ATTag } from 'shared/models/at.tag';

@Injectable( {
	providedIn: 'root'
} )
export class TagsService {

	constructor(
		private ss: AdminSharedService
	) { }

	public create = ( payload: Partial<ATTag> ) => this.ss.create( 'tags', payload );
}
